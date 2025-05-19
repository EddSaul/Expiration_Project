import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import './CreateUsers.css'; // Import your CSS file

const CreateUsers = () => {
  // Role options
  const roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Staff', value: 'staff' }
  ];

  // Mock data with roles
  const initialUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
    { id: 2, username: 'manager', email: 'manager@store.com', role: 'manager' },
    { id: 3, username: 'staff', email: 'staff@store.com', role: 'staff' }
  ];

  const [users, setUsers] = useState(initialUsers);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [user, setUser] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'staff' // Default role
  });

  const saveUser = () => {
    if (user.id) {
      // Edit existing
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      // Add new
      setUsers([...users, { ...user, id: users.length + 1 }]);
    }
    setDisplayDialog(false);
  };

  const editUser = (user) => {
    setUser({ ...user, password: '' });
    setDisplayDialog(true);
  };

  const deleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Role badge template
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

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Users Management</h2>
        <Button 
          label="Add User" 
          icon="pi pi-plus" 
          onClick={() => {
            setUser({ username: '', email: '', password: '', role: 'staff' });
            setDisplayDialog(true);
          }}
        />
      </div>

      <DataTable value={users} paginator rows={5} className="p-datatable-sm">
        <Column field="username" header="Username" sortable />
        <Column field="email" header="Email" sortable />
        <Column 
          field="role" 
          header="Role" 
          body={roleBodyTemplate}
          sortable 
        />
        <Column 
          header="Actions" 
          body={(rowData) => (
            <div className="flex gap-2">
              <Button 
                icon="pi pi-pencil" 
                className="p-button-rounded p-button-success p-button-sm" 
                onClick={() => editUser(rowData)} 
              />
              <Button 
                icon="pi pi-trash" 
                className="p-button-rounded p-button-danger p-button-sm" 
                onClick={() => deleteUser(rowData.id)} 
              />
            </div>
          )}
        />
      </DataTable>

      <Dialog 
        visible={displayDialog} 
        onHide={() => setDisplayDialog(false)}
        header={user.id ? "Edit User" : "Add User"}
        style={{ width: '30vw' }}
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="username">Username*</label>
            <InputText 
              id="username" 
              value={user.username} 
              onChange={(e) => setUser({ ...user, username: e.target.value })} 
              required
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="email">Email*</label>
            <InputText 
              id="email" 
              value={user.email} 
              onChange={(e) => setUser({ ...user, email: e.target.value })} 
              required
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="role">Role*</label>
            <Dropdown
              id="role"
              value={user.role}
              options={roles}
              onChange={(e) => setUser({ ...user, role: e.value })}
              placeholder="Select Role"
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="password">
              {user.id ? "New Password (leave blank to keep)" : "Password*"}
            </label>
            <Password 
              id="password" 
              value={user.password} 
              onChange={(e) => setUser({ ...user, password: e.target.value })} 
              toggleMask 
              feedback={false}
              required={!user.id}
            />
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
            onClick={saveUser} 
          />
        </div>
      </Dialog>
    </div>
  );
};

export default CreateUsers;