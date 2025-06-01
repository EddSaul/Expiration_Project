import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ToggleButton } from 'primereact/togglebutton';
import { Button } from 'primereact/button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './Dashboard.css';
import NavBar from '../NavBar/NavBar';

const ProductExpiryTracker = () => {

  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ 
    code: '',
    name: '',
    brand: null,
    category: null,
    expiry_date: null,
    quantity: 0,
    taken_out: false
  });
  const [loading, setLoading] = useState({
    products: false,
    categories: false,
    brands: false
  });
  const [search, setSearch] = useState({
    brand: '',
    category: ''
  });

  useEffect(() => {
    if (session) {
      fetchProducts();
      fetchCategories();
      fetchBrands();
    }
  }, [session]);

  useEffect(() => {
    filterCategories();
  }, [search.category, categories]);

  useEffect(() => {
    filterBrands();
  }, [search.brand, brands]);

  const fetchCategories = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      setFilteredCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const fetchBrands = async () => {
    setLoading(prev => ({ ...prev, brands: true }));
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
      setFilteredBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(prev => ({ ...prev, brands: false }));
    }
  };

  const fetchProducts = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      let query = supabase
        .from('users_products')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData?.role !== 'admin') {
          query = query.eq('user_id', session.user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setProducts(data?.map(p => ({
        ...p,
        expiry_date: p.expiry_date ? new Date(p.expiry_date) : null,
        brand: brands.find(b => b.id === p.brand_id) || null,
        category: categories.find(c => c.id === p.category_id) || null
      })) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const filterCategories = () => {
    if (!search.category) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(search.category.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  const filterBrands = () => {
    if (!search.brand) {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter(brand =>
        brand.name.toLowerCase().includes(search.brand.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  };

  const handleInputChange = (e, field) => {
    setNewProduct({ ...newProduct, [field]: e.value });
  };

  const handleTextChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.id]: e.target.value });
  };

  const handleSearchChange = (e, field) => {
    setSearch({ ...search, [field]: e.target.value });
  };

  const addProduct = async () => {
    if (!newProduct.code || !newProduct.name) return;
    setLoading(prev => ({ ...prev, products: true }));
    
    try {
      const productToAdd = {
        ...newProduct,
        user_id: session.user.id,
        brand_id: newProduct.brand?.id || null,
        category_id: newProduct.category?.id || null,
        expiry_date: newProduct.expiry_date?.toISOString(),
        taken_out: false
      };

      const { data, error } = await supabase
        .from('users_products')
        .insert([productToAdd])
        .select();

      if (error) throw error;

      setProducts([...products, {
        ...data[0],
        expiry_date: data[0].expiry_date ? new Date(data[0].expiry_date) : null,
        brand: newProduct.brand,
        category: newProduct.category
      }]);
      setNewProduct({ 
        code: '',
        name: '',
        brand: null,
        category: null,
        expiry_date: null,
        quantity: 0,
        taken_out: false
      });
      setSearch({ brand: '', category: '' });
    } catch (error) {
      console.error('Error adding product:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const toggleTaken_out = async (rowData) => {
    try {
      const { error } = await supabase
        .from('users_products')
        .update({ taken_out: !rowData.taken_out })
        .eq('id', rowData.id);

      if (error) throw error;

      const updatedProducts = products.map(product => 
        product.id === rowData.id ? { ...product, taken_out: !product.taken_out } : product
      );
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const taken_outBodyTemplate = (rowData) => {
    return (
      <ToggleButton
        checked={rowData.taken_out}
        onChange={() => toggleTaken_out(rowData)}
        onLabel="Taken"
        offLabel="Available"
        onIcon="pi pi-check"
        offIcon="pi pi-times"
        disabled={loading.products}
      />
    );
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(prev => ({ ...prev, products: true }));
    
    try {
      const { error } = await supabase
        .from('users_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-danger p-button-sm"
        onClick={() => deleteProduct(rowData.id)}
        disabled={loading.products}
      />
    );
  };

  const brandDropdownTemplate = (option) => {
    return (
      <div className="brand-option">
        <div>{option.name}</div>
      </div>
    );
  };

  const categoryDropdownTemplate = (option) => {
    return (
      <div className="category-option">
        <div>{option.name}</div>
      </div>
    );
  };

  const brandPanelTemplate = (options) => {
    return (
      <div className="dropdown-panel">
        <div className="search-input-container">
          <InputText
            value={search.brand}
            onChange={(e) => handleSearchChange(e, 'brand')}
            placeholder="Search brands..."
            className="search-input"
          />
          <i className="pi pi-search search-icon" />
        </div>
        <div className="dropdown-items">
          {options}
        </div>
      </div>
    );
  };

  const categoryPanelTemplate = (options) => {
    return (
      <div className="dropdown-panel">
        <div className="search-input-container">
          <InputText
            value={search.category}
            onChange={(e) => handleSearchChange(e, 'category')}
            placeholder="Search categories..."
            className="search-input"
          />
          <i className="pi pi-search search-icon" />
        </div>
        <div className="dropdown-items">
          {options}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <h1>Product Expiry Tracker</h1>
      <NavBar />
      <div className="input-row">
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
              disabled={loading.products}
            />
          </div>
        </div>

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
              disabled={loading.products}
            />
          </div>
        </div>

        <div className="input-group">
          <Dropdown 
            value={newProduct.brand} 
            onChange={(e) => handleInputChange(e, 'brand')} 
            options={filteredBrands} 
            optionLabel="name" 
            placeholder={loading.brands ? "Loading brands..." : "Select Brand"} 
            disabled={loading.products || loading.brands}
            loading={loading.brands}
            itemTemplate={brandDropdownTemplate}
            panelTemplate={brandPanelTemplate}
            filter
            showFilterClear
            resetFilterOnHide
            className="searchable-dropdown"
          />
        </div>

        <div className="input-group">
          <Dropdown 
            value={newProduct.category} 
            onChange={(e) => handleInputChange(e, 'category')} 
            options={filteredCategories} 
            optionLabel="name" 
            placeholder={loading.categories ? "Loading categories..." : "Select Category"} 
            disabled={loading.products || loading.categories}
            loading={loading.categories}
            itemTemplate={categoryDropdownTemplate}
            panelTemplate={categoryPanelTemplate}
            filter
            showFilterClear
            resetFilterOnHide
            className="searchable-dropdown"
          />
        </div>

        <div className="input-group">
          <Calendar 
            value={newProduct.expiry_date} 
            onChange={(e) => handleInputChange(e, 'expiry_date')} 
            placeholder="Expiry Date" 
            dateFormat="dd/mm/yy" 
            showIcon 
            disabled={loading.products}
          />
        </div>

        <div className="input-group">
          <InputNumber 
            value={newProduct.quantity} 
            onValueChange={(e) => handleInputChange(e, 'quantity')} 
            placeholder="Qty" 
            disabled={loading.products}
          />
        </div>

        <div className="input-group add-button-container">
          <Button 
            label="Add" 
            icon="pi pi-plus" 
            onClick={addProduct} 
            disabled={!newProduct.code || !newProduct.name || loading.products} 
            className="add-button"
            loading={loading.products}
          />
        </div>
      </div>
      
      <div className="card">
        <DataTable 
          value={products} 
          loading={loading.products}
          paginator
          rows={10}
          emptyMessage="No products found"
        >
          <Column field="code" header="Code" sortable />
          <Column field="name" header="Name" sortable />
          <Column 
            field="brand.name" 
            header="Brand" 
            sortable 
            body={(rowData) => rowData.brand?.name || 'N/A'}
          />
          <Column 
            field="category.name" 
            header="Category" 
            sortable 
            body={(rowData) => rowData.category?.name || 'N/A'}
          />
          <Column 
            field="expiry_date" 
            header="Expiry Date" 
            body={(rowData) => rowData.expiry_date?.toLocaleDateString() || 'N/A'} 
            sortable 
          />
          <Column field="quantity" header="Quantity" sortable />
          <Column 
            header="Status" 
            body={taken_outBodyTemplate} 
            style={{ textAlign: 'center' }}
          />
          {session?.user?.role === 'admin' && (
            <Column 
              field="user_id" 
              header="Owner" 
              body={(rowData) => rowData.user_id === session.user.id ? 'You' : rowData.user_id}
            />
          )}
          <Column 
            header="Actions" 
            body={actionBodyTemplate} 
            style={{ width: '80px', textAlign: 'center' }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default ProductExpiryTracker;