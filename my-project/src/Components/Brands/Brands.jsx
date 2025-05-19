import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import './Brands.css'; 

const Brands = () => {
  // Mock data
  const initialBrands = [
    { id: 1, name: 'Nestle', in_offer_program: true },
    { id: 2, name: 'Coca-Cola', in_offer_program: false },
    { id: 3, name: 'Pepsi', in_offer_program: true }
  ];

  const [brands, setBrands] = useState(initialBrands);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [brand, setBrand] = useState({ name: '', in_offer_program: false });

  const saveBrand = () => {
    if (brand.id) {
      // Edit existing
      setBrands(brands.map(b => b.id === brand.id ? brand : b));
    } else {
      // Add new
      setBrands([...brands, { ...brand, id: brands.length + 1 }]);
    }
    setDisplayDialog(false);
  };

  const editBrand = (brand) => {
    setBrand({ ...brand });
    setDisplayDialog(true);
  };

  const deleteBrand = (id) => {
    setBrands(brands.filter(b => b.id !== id));
  };

  return (
    <div className="brands-container">
      <div className="brands-header">
        <h2>Brands Management</h2>
        <Button 
          label="Add Brand" 
          icon="pi pi-plus" 
          onClick={() => {
            setBrand({ name: '', in_offer_program: false });
            setDisplayDialog(true);
          }}
        />
      </div>

      <DataTable value={brands} paginator rows={5} className="p-datatable-sm">
        <Column field="name" header="Brand Name" sortable />
        <Column 
          field="in_offer_program" 
          header="In Offer Program" 
          body={(rowData) => (
            <i className={`pi ${rowData.in_offer_program ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'}`} />
          )}
        />
        <Column 
          header="Actions" 
          body={(rowData) => (
            <div className="flex gap-2">
              <Button 
                icon="pi pi-pencil" 
                className="p-button-rounded p-button-success p-button-sm" 
                onClick={() => editBrand(rowData)} 
              />
              <Button 
                icon="pi pi-trash" 
                className="p-button-rounded p-button-danger p-button-sm" 
                onClick={() => deleteBrand(rowData.id)} 
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => setDisplayDialog(false)}
        header={brand.id ? "Edit Brand" : "Add Brand"}
        style={{ width: '30vw' }}
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="name">Brand Name</label>
            <InputText 
              id="name" 
              value={brand.name} 
              onChange={(e) => setBrand({ ...brand, name: e.target.value })} 
            />
          </div>
          <div className="field-checkbox mt-3">
            <Checkbox 
              inputId="offer" 
              checked={brand.in_offer_program} 
              onChange={(e) => setBrand({ ...brand, in_offer_program: e.checked })} 
            />
            <label htmlFor="offer" className="ml-2">Include in offer program</label>
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button 
            label="Cancel" 
            className="p-button-text" 
            onClick={() => setDisplayDialog(false)} 
          />
          <Button 
            label="Save" 
            onClick={saveBrand} 
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Brands;