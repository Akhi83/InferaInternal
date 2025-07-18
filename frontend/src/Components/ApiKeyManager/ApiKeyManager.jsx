import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Copy, Eye, EyeOff, Trash2, Plus } from 'lucide-react';
import './APIKeyManager.css';

const APIKeyManager = () => {
  const { getToken } = useAuth();

  const [apiKeys, setApiKeys] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    expiresIn: '30'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchApiKeys = async () => {
    try {
      const token = await getToken();
      const res = await axios.get('/api/list_api_keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(res.data.keys);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setApiKeys([]);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [getToken]);

  const createApiKey = async () => {
    if (!newKeyForm.name.trim()) {
      setError('API Key name cannot be empty.');
      return;
    }

    if (creating) return;

    setCreating(true);
    setError('');

    try {
      const token = await getToken();
      await axios.post('/api/generate_api_key', {
        key_name: newKeyForm.name,
        expires_in_days: parseInt(newKeyForm.expiresIn)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchApiKeys();

      setNewKeyForm({ name: '', expiresIn: '30' });
      setShowCreateForm(false);
      setError('');
    } catch (err) {
      console.error('Error creating API key:', err);
      setError('Failed to create API key. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (key_id) => {
    try {
      const token = await getToken();
      await axios.post('/api/delete_api_key', { key_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(apiKeys.filter(k => k.key_id !== key_id));
    } catch (err) {
      console.error('Error deleting API key:', err);
    }
  };

  const toggleVisibility = (key_id) => {
    const newSet = new Set(visibleKeys);
    if (newSet.has(key_id)) newSet.delete(key_id);
    else newSet.add(key_id);
    setVisibleKeys(newSet);
  };

  const copyToClipboard = (key, key_id) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(key_id);
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  const maskKey = (key) => key ? key.slice(0, 8) + '...' + key.slice(-8) : '****-****-****';

  return (
    <div className="api-manager-container">
      <div className="api-manager-header">
        <div className="title-section">
          <div>
            <h1>API Key Management</h1>
            <p>Manage your API keys and usage.</p>
          </div>
        </div>
        <button className="create-btn" onClick={() => { 
          setShowCreateForm(true); 
          setError('');
        }}>
          <Plus size={16} /> Create New Key
        </button>
      </div>

      <div className="api-stats">
        <div className="stat-card blue">
          <div>
            <p>Total Keys</p>
            <h2>{apiKeys.length}</h2>
          </div>
        </div>
        <div className="stat-card green">
          <div>
            <p>Active Keys</p>
            <h2>{apiKeys.filter(k => k.is_active).length}</h2>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New API Key</h3>

          {error && <p className="error-message">{error}</p>}

          <input
            type="text"
            placeholder="Key Name"
            value={newKeyForm.name}
            onChange={(e) => setNewKeyForm({ ...newKeyForm, name: e.target.value })}
          />
          <h4>Expiry Duration</h4>
          <select
            value={newKeyForm.expiresIn}
            onChange={(e) => setNewKeyForm({ ...newKeyForm, expiresIn: e.target.value })}
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="365">1 Year</option>
          </select>
          <div className="form-actions">
            <button
              className="create-btn"
              onClick={createApiKey}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              className="cancel-btn"
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyForm({ name: '', expiresIn: '30' });
                setError('');
              }}
              disabled={creating}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="api-key-list">
        {apiKeys.map(key => (
          <div className="api-key-row" key={key.key_id}>
            <div className="key-info">
              <div className="key-header">
                <strong className="key-name">{key.key_name}</strong>
                <span className={key.is_active ? 'status active' : 'status revoked'}>
                  {key.is_active ? 'Active' : 'Revoked'}
                </span>
              </div>

              <span className="dates">
                Created: {new Date(key.created_at).toLocaleDateString()} | 
                Expires: {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'} | 
                Last Used: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
              </span>

              <div className="key-visual">
                <code className="api-key-value">
                  {visibleKeys.has(key.key_id) ? (key.key || maskKey('****-****-****')) : maskKey(key.key)}
                </code>

                <div className="key-actions-right">
                  <button
                    className="key-action-btn"
                    onClick={() => toggleVisibility(key.key_id)}
                    title="Toggle visibility"
                  >
                    {visibleKeys.has(key.key_id) ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  <button
                    className={`key-action-btn ${copiedKeyId === key.key_id ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(key.key || '', key.key_id)}
                    title="Copy API Key"
                  >
                    {copiedKeyId === key.key_id ? 'Copied!' : <Copy size={14} />}
                  </button>
                </div>
              </div>

            </div>

            <div className="key-actions">
              <button onClick={() => deleteApiKey(key.key_id)} title="Delete API Key">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIKeyManager;
