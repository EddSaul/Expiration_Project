import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ToggleButton } from 'primereact/togglebutton';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Dashboard.css';
import NavBar from '../NavBar/NavBar';

const ProductExpiryTracker = () => {
  // Sample categories and brands
  const categories = [
    { name: 'Dairy', code: 'DA' },
    { name: 'Meat', code: 'ME' },
    { name: 'Vegetables', code: 'VG' },
    { name: 'Fruits', code: 'FR' },
    { name: 'Bakery', code: 'BK' }
  ];

  const brands = [
    { name: 'Brand A', code: 'BA' },
    { name: 'Brand B', code: 'BB' },
    { name: 'Brand C', code: 'BC' }
  ];

  // Initial empty product
  const emptyProduct = {
    code: '',
    name: '',
    brand: null,
    category: null,
    expiryDate: null,
    quantity: 0,
    takenOut: false
  };

  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ ...emptyProduct });

  const handleInputChange = (e, field) => {
    setNewProduct({ ...newProduct, [field]: e.value });
  };

  const handleTextChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.id]: e.target.value });
  };

  const addProduct = () => {
    if (newProduct.code && newProduct.name) {
      setProducts([...products, newProduct]);
      setNewProduct({ ...emptyProduct });
    }
  };

  const toggleTakenOut = (rowData) => {
    const updatedProducts = products.map(product => 
      product.code === rowData.code ? { ...product, takenOut: !product.takenOut } : product
    );
    setProducts(updatedProducts);
  };

  const takenOutBodyTemplate = (rowData) => {
    return (
      <ToggleButton
        checked={rowData.takenOut}
        onChange={() => toggleTakenOut(rowData)}
        onLabel="Taken"
        offLabel="Available"
        onIcon="pi pi-check"
        offIcon="pi pi-times"
      />
    );
  };

  return (
    
    <div className="dashboard-container">
      <h1>Product Expiry Tracker</h1>
      
      <NavBar></NavBar>
      
      <div className="input-row">
        {/* Product Code */}
        <div className="input-group">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-barcode"></i>
            </span>
            <InputText 
              id="code" 
              value={newProduct.code} 
              onChange={handleTextChange} 
              placeholder="Product Code" 
            />
          </div>
        </div>

        {/* Product Name */}
        <div className="input-group">
          <div className="p-inputgroup">
            <span className="p-inputgroup-addon">
              <i className="pi pi-tag"></i>
            </span>
            <InputText 
              id="name" 
              value={newProduct.name} 
              onChange={handleTextChange} 
              placeholder="Product Name" 
            />
          </div>
        </div>

        {/* Brand */}
        <div className="input-group">
          <Dropdown 
            value={newProduct.brand} 
            onChange={(e) => handleInputChange(e, 'brand')} 
            options={brands} 
            optionLabel="name" 
            placeholder="Select Brand" 
          />
        </div>

        {/* Category */}
        <div className="input-group">
          <Dropdown 
            value={newProduct.category} 
            onChange={(e) => handleInputChange(e, 'category')} 
            options={categories} 
            optionLabel="name" 
            placeholder="Select Category" 
          />
        </div>

        {/* Expiry Date */}
        <div className="input-group">
          <Calendar 
            value={newProduct.expiryDate} 
            onChange={(e) => handleInputChange(e, 'expiryDate')} 
            placeholder="Expiry Date" 
            dateFormat="dd/mm/yy" 
            showIcon 
          />
        </div>

        {/* Quantity */}
        <div className="input-group">
          <InputNumber 
            value={newProduct.quantity} 
            onValueChange={(e) => handleInputChange(e, 'quantity')} 
            placeholder="Qty" 
          />
        </div>

        {/* Add Button */}
        <div className="input-group add-button-container" >
          <Button 
            label="Add" 
            icon="pi pi-plus" 
            onClick={addProduct} 
            disabled={!newProduct.code || !newProduct.name} 
            className="add-button"
          />
        </div>
      </div>
      
      {/* Products Table */}
      <div className="card">
        <DataTable 
          value={products} 
        >
          <Column field="code" header="Code" sortable></Column>
          <Column field="name" header="Name" sortable></Column>
          <Column field="brand.name" header="Brand" sortable></Column>
          <Column field="category.name" header="Category" sortable></Column>
          <Column 
            field="expiryDate" 
            header="Expiry Date" 
            sortable 
            body={(rowData) => rowData.expiryDate?.toLocaleDateString()}
          ></Column>
          <Column field="quantity" header="Quantity" sortable></Column>
          <Column 
            header="Status" 
            body={takenOutBodyTemplate} 
            style={{ textAlign: 'center' }}
          ></Column>
        </DataTable>
      </div>
    </div>
  );
};

export default ProductExpiryTracker;