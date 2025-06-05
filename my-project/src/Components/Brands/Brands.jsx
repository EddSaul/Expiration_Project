import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import './Brands.css';

const Brands = () => {
  const { session } = useAuth();
  const [brands, setBrands] = useState([]);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [brand, setBrand] = useState({ 
    name: '', 
    in_offer_program: false 
  });
  const [loading, setLoading] = useState(false);
  const isAdmin = async(userId) => {
    const { data, error } = await supabase
   .from('users')
   .select('role')
   .eq('id', userId)
   .single();
 }

  // Fetch brands from Supabase
  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const saveBrand = async () => {
    if (!brand.name) return;
    setLoading(true);
    try {
      if (brand.id) {
        // Update existing brand
        const { data, error } = await supabase
          .from('brands')
          .update(brand)
          .eq('id', brand.id)
          .select();

        if (error) throw error;
        setBrands(brands.map(b => b.id === brand.id ? data[0] : b));
      } else {
        // Add new brand
        const { data, error } = await supabase
          .from('brands')
          .insert([brand])
          .select();

        if (error) throw error;
        setBrands([data[0], ...brands]);
      }
      setDisplayDialog(false);
      setBrand({ name: '', in_offer_program: false });
    } catch (error) {
      console.error('Error saving brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const editBrand = (brand) => {
    setBrand({ ...brand });
    setDisplayDialog(true);
  };

  const deleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBrands(brands.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const offerProgramBodyTemplate = (rowData) => {
    return (
      <div className="offer-program-cell">
        <i 
          className={`pi ${rowData.in_offer_program ? 
            'pi-check-circle text-green-500' : 
            'pi-times-circle text-red-500'}`}
        />
        <span className="offer-program-text">
          {rowData.in_offer_program ? 'Included' : 'Excluded'}
        </span>
      </div>
    );
  };

  const actionBodyTemplate = (rowData) => {
    if (!isAdmin) return null;
    
    return (
      <div className="action-buttons">
        <Button 
          icon="pi pi-pencil" 
          className="p-button-rounded p-button-success p-button-sm" 
          onClick={() => editBrand(rowData)}
          tooltip="Edit"
          tooltipOptions={{ position: 'top' }}
        />
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-danger p-button-sm" 
          onClick={() => deleteBrand(rowData.id)}
          tooltip="Delete"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };


    
  return (
    
    <div className="brands-container">
      <div className="brands-header">
        <h2>Brands Management</h2>
        {isAdmin && (
          <Button 
            label="Add Brand" 
            icon="pi pi-plus" 
            onClick={() => {
              setBrand({ name: '', in_offer_program: false });
              setDisplayDialog(true);
            }}
            severity="success"
          />
        )}
      </div>

      <DataTable 
        value={brands} 
        paginator 
        rows={10}
        loading={loading}
        className="brands-table"
        emptyMessage="No brands found"
        size="small"
      >
        <Column field="id" header="ID" sortable style={{ width: '80px' }} />
        <Column field="name" header="Brand Name" sortable />
        <Column 
          field="in_offer_program" 
          header="Offer Program" 
          body={offerProgramBodyTemplate}
          sortable
          style={{ width: '150px' }}
        />
        <Column 
          header="Actions" 
          body={actionBodyTemplate}
          style={{ width: '120px' }}
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => !loading && setDisplayDialog(false)}
        header={brand.id ? "Edit Brand" : "Add New Brand"}
        className="brand-dialog"
        dismissableMask={!loading}
        closable={!loading}
        style={{ width: '450px' }}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="name" className="block mb-2 font-medium">
              Brand Name*
            </label>
            <InputText 
              id="name" 
              value={brand.name} 
              onChange={(e) => setBrand({ ...brand, name: e.target.value })} 
              required
              disabled={loading}
              className="w-full"
              placeholder="Enter brand name"
            />
          </div>
          <div className="field-checkbox flex items-center">
            <Checkbox 
              inputId="offer" 
              checked={brand.in_offer_program} 
              onChange={(e) => setBrand({ ...brand, in_offer_program: e.checked })} 
              disabled={loading}
              className="mr-2"
            />
            <label htmlFor="offer">Include in offer program</label>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-5">
          <Button 
            label="Cancel" 
            className="p-button-text" 
            onClick={() => setDisplayDialog(false)} 
            disabled={loading}
          />
          <Button 
            label={brand.id ? "Update" : "Create"} 
            onClick={saveBrand} 
            loading={loading}
            disabled={!brand.name || loading}
            icon="pi pi-check"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Brands;