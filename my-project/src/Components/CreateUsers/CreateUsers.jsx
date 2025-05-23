import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import './CreateUsers.css';

const CreateUsers = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [user, setUser] = useState({ 
    email: '', 
    password: '', 
    username: '',
    role: 'staff'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Staff', value: 'staff' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!user.email) newErrors.email = 'Email is required';
    if (!user.password) newErrors.password = 'Password is required';
    if (user.password.length < 1)
      newErrors.password = 'Password must be at least 1 character';
    if (!user.username) newErrors.username = 'Username is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      ]);
      if (profileError) throw profileError;

      alert('User created successfully');
      setUser({ email: '', password: '', username: '', role: 'staff' });
      setDisplayDialog(false);
      await fetchUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const roleBodyTemplate = (rowData) => {
    const severity = {
      'admin': 'danger',
      'manager': 'warning',
      'staff': 'success'
    }[rowData.role];

    return (
      <span className={`p-tag p-tag-${severity}`}>
        {rowData.role.toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Users Management</h2>
        <Button 
          label="Add User" 
          icon="pi pi-plus" 
          onClick={() => {
            setUser({ email: '', password: '', username: '', role: 'staff' });
            setDisplayDialog(true);
          }}
          loading={loading}
        />
      </div>

      <DataTable 
        value={users} 
        paginator 
        rows={10}
        loading={loading}
        className="users-table"
      >
        <Column field="username" header="Username" sortable />
        <Column field="email" header="Email" sortable />
        <Column 
          field="role" 
          header="Role" 
          body={roleBodyTemplate}
          sortable 
        />
        <Column 
          field="created_at" 
          header="Created" 
          body={(rowData) => new Date(rowData.created_at).toLocaleDateString()}
          sortable
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => !loading && setDisplayDialog(false)}
        header="Add New User"
        className="user-dialog"
        dismissableMask={!loading}
        closable={!loading}
      >
        <div className="p-fluid user-form">
          <div className="p-field">
            <label htmlFor="email">Email*</label>
            <InputText 
              id="email" 
              type="email"
              value={user.email} 
              onChange={(e) => setUser({ ...user, email: e.target.value })} 
              className={errors.email ? 'p-invalid' : ''}
            />
            {errors.email && <small className="p-error">{errors.email}</small>}
          </div>
          <div className="p-field">
            <label htmlFor="username">Username*</label>
            <InputText 
              id="username" 
              value={user.username} 
              onChange={(e) => setUser({ ...user, username: e.target.value })} 
              className={errors.username ? 'p-invalid' : ''}
            />
            {errors.username && <small className="p-error">{errors.username}</small>}
          </div>
          <div className="p-field">
            <label htmlFor="password">Password*</label>
            <Password 
              id="password" 
              value={user.password} 
              onChange={(e) => setUser({ ...user, password: e.target.value })} 
              toggleMask 
              feedback={false}
              className={errors.password ? 'p-invalid' : ''}
            />
            {errors.password && <small className="p-error">{errors.password}</small>}
          </div>
          <div className="p-field">
            <label htmlFor="role">Role*</label>
            <Dropdown
              id="role"
              value={user.role}
              options={roles}
              onChange={(e) => setUser({ ...user, role: e.value })}
              placeholder="Select Role"
            />
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
            onClick={addUser} 
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default CreateUsers;