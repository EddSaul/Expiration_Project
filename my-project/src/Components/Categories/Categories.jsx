import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Chip } from 'primereact/chip';
import { InputNumber } from 'primereact/inputnumber';
import './Categories.css';

const Categories = () => {
  // Mock data
  const initialCategories = [
    { id: 1, name: 'Dairy', discountDays: [30, 15, 5] },
    { id: 2, name: 'Meat', discountDays: [20, 10, 3] },
    { id: 3, name: 'Bakery', discountDays: [7, 3, 1] }
  ];

  const [categories, setCategories] = useState(initialCategories);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [category, setCategory] = useState({ 
    name: '', 
    discountDays: [30, 15, 5] // Default values
  });
  const [newDay, setNewDay] = useState('');

  const saveCategory = () => {
    if (category.id) {
      // Edit existing
      setCategories(categories.map(c => c.id === category.id ? category : c));
    } else {
      // Add new
      setCategories([...categories, { ...category, id: categories.length + 1 }]);
    }
    setDisplayDialog(false);
  };

  const editCategory = (category) => {
    setCategory({ ...category });
    setDisplayDialog(true);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const addDiscountDay = () => {
    if (newDay && !category.discountDays.includes(Number(newDay))) {
      setCategory({
        ...category,
        discountDays: [...category.discountDays, Number(newDay)].sort((a, b) => b - a) // Sort descending
      });
      setNewDay('');
    }
  };

  const removeDiscountDay = (day) => {
    setCategory({
      ...category,
      discountDays: category.discountDays.filter(d => d !== day)
    });
  };

  const daysBodyTemplate = (rowData) => {
    return (
      <div className="discount-days-container">
        {rowData.discountDays.map(day => (
          <Chip 
            key={day} 
            label={`${day} days`} 
            className="discount-day-chip" 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="categories-container">
      <div className="categories-header">
        <h2>Categories Management</h2>
        <Button 
          label="Add Category" 
          icon="pi pi-plus" 
          onClick={() => {
            setCategory({ name: '', discountDays: [30, 15, 5] });
            setDisplayDialog(true);
          }}
        />
      </div>

      <DataTable value={categories} paginator rows={5} className="categories-table">
        <Column field="id" header="ID" sortable />
        <Column field="name" header="Name" sortable />
        <Column 
          header="Discount Days" 
          body={daysBodyTemplate}
          sortable 
          sortField="discountDays"
        />
        <Column 
          header="Actions" 
          body={(rowData) => (
            <div className="action-buttons">
              <Button 
                icon="pi pi-pencil" 
                className="p-button-rounded p-button-success p-button-sm" 
                onClick={() => editCategory(rowData)} 
              />
              <Button 
                icon="pi pi-trash" 
                className="p-button-rounded p-button-danger p-button-sm" 
                onClick={() => deleteCategory(rowData.id)} 
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => setDisplayDialog(false)}
        header={category.id ? "Edit Category" : "Add Category"}
        className="category-dialog"
      >
        <div className="p-fluid category-form">
          <div className="p-field">
            <label htmlFor="name">Category Name*</label>
            <InputText 
              id="name" 
              value={category.name} 
              onChange={(e) => setCategory({ ...category, name: e.target.value })} 
              required
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
              />
              <Button 
                icon="pi pi-plus" 
                className="p-button-text"
                onClick={addDiscountDay}
                disabled={!newDay}
              />
            </div>
            
            <div className="discount-days-chips">
              {category.discountDays.map(day => (
                <Chip
                  key={day}
                  label={`${day} days`}
                  removable
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
          />
          <Button 
            label="Save" 
            onClick={saveCategory} 
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Categories;