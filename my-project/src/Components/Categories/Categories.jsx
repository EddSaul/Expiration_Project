import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Chip } from 'primereact/chip';
import { InputNumber } from 'primereact/inputnumber';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import './Categories.css';

const Categories = () => {
  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [category, setCategory] = useState({ 
    name: '', 
    discount_days: [30, 15, 5] 
  });
  const [newDay, setNewDay] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        discount_days: Array.isArray(item.discount_days) ? item.discount_days : []
      })) || [];

      setCategories(formattedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const saveCategory = async () => {
    if (!category.name) return;
    setLoading(true);
    try {
      if (category.id) {
        const { data, error } = await supabase
          .from('categories')
          .update({
            name: category.name,
            discount_days: category.discount_days
          })
          .eq('id', category.id)
          .select();

        if (error) throw error;
        setCategories(categories.map(c => c.id === category.id ? data[0] : c));
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([{
            name: category.name,
            discount_days: category.discount_days
          }])
          .select();

        if (error) throw error;
        setCategories([...categories, data[0]]);
      }
      setDisplayDialog(false);
      setCategory({ name: '', discount_days: [30, 15, 5] });
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  const editCategory = (cat) => {
    setCategory({ 
      ...cat,
      discount_days: Array.isArray(cat.discount_days) ? cat.discount_days : []
    });
    setDisplayDialog(true);
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDiscountDay = () => {
    const dayNum = Number(newDay);
    if (newDay && !isNaN(dayNum) && !category.discount_days.includes(dayNum)) {
      setCategory({
        ...category,
        discount_days: [...category.discount_days, dayNum].sort((a, b) => b - a)
      });
      setNewDay('');
    }
  };

  const removeDiscountDay = (day) => {
    setCategory({
      ...category,
      discount_days: category.discount_days.filter(d => d !== day)
    });
  };

  const daysBodyTemplate = (rowData) => {
    const days = Array.isArray(rowData.discount_days) ? rowData.discount_days : [];
    return (
      <div className="discount-days-container">
        {days.map(day => (
          <Chip 
            key={day} 
            label={`${day} days`} 
            className="discount-day-chip" 
          />
        ))}
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    const isAdmin = async(userId) => {
      const { data, error } = await supabase
     .from('users')
     .select('role')
     .eq('id', userId)
     .single();
   }
   if (!isAdmin) return null;
    
    return (
      <div className="action-buttons">
        <Button 
          icon="pi pi-pencil" 
          className="p-button-rounded p-button-success p-button-sm mr-2" 
          onClick={() => editCategory(rowData)} 
          tooltip="Edit"
          tooltipOptions={{ position: 'top' }}
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-danger p-button-sm" 
          onClick={() => deleteCategory(rowData.id)} 
          tooltip="Delete"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h2>Categories Management</h2>
        {session?.user?.user_metadata?.role === 'admin' && (
          <Button 
            label="Add Category" 
            icon="pi pi-plus" 
            onClick={() => {
              setCategory({ name: '', discount_days: [30, 15, 5] });
              setDisplayDialog(true);
            }}
          />
        )}
      </div>

      <DataTable 
        value={categories} 
        paginator 
        rows={10}
        loading={loading}
        className="categories-table"
        emptyMessage="No categories found"
      >
        <Column field="id" header="ID" sortable />
        <Column field="name" header="Name" sortable />
        <Column 
          field="discount_days"
          header="Discount Days" 
          body={daysBodyTemplate}
          sortable 
        />
        <Column 
          header="Actions" 
          body={actionBodyTemplate}
          style={{ width: '150px' }}
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => !loading && setDisplayDialog(false)}
        header={category.id ? "Edit Category" : "Add Category"}
        className="category-dialog"
        dismissableMask={!loading}
        closable={!loading}
      >
        <div className="p-fluid category-form">
          <div className="p-field">
            <label htmlFor="name">Category Name*</label>
            <InputText 
              id="name" 
              value={category.name} 
              onChange={(e) => setCategory({ ...category, name: e.target.value })} 
              required
              disabled={loading}
            />
          </div>
          
          <div className="p-field">
            <label>Discount Days (Before Expiry)</label>
            <div className="discount-days-input">
              <InputNumber
                value={newDay}
                onValueChange={(e) => setNewDay(e.value)}
                placeholder="Add days"
                min={1}
                max={365}
                showButtons
                disabled={loading}
              />
              <Button 
                icon="pi pi-plus" 
                className="p-button-text"
                onClick={addDiscountDay}
                disabled={!newDay || loading}
              />
            </div>
            
            <div className="discount-days-chips">
              {Array.isArray(category.discount_days) && category.discount_days.map(day => (
                <Chip
                  key={day}
                  label={`${day} days`}
                  removable={!loading}
                  onRemove={() => removeDiscountDay(day)}
                  className="discount-day-chip"
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="dialog-footer">
          <Button 
            label="Cancel" 
            className="p-button-text" 
            onClick={() => setDisplayDialog(false)} 
            disabled={loading}
          />
          <Button 
            label="Save" 
            onClick={saveCategory} 
            loading={loading}
            disabled={!category.name || loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Categories;
