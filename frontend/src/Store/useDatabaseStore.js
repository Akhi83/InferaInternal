import { create } from 'zustand';
import axios from 'axios';
import { toast } from 'react-toastify';

const useDatabaseStore = create((set, get) => ({
  databases: [],
  selectedDb: null,
  editData: null,
  showModal: false,
  showDeleteModal: false,
  databaseToDelete: null,

  setDatabases: (dbs) => set({ databases: dbs }),
  setSelectedDb: (db) => set({ selectedDb: db }),

  fetchDatabases: async (token) => {
    try {
      const res = await axios.get('/api/databases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ databases: res.data });
    } catch (error) {
      console.error("Error fetching databases:", error);
    }
  },

  setShowModal: (show) => set({ showModal: show }),
  setEditData: (data) => set({ editData: data }),
  setShowDeleteModal: (show) => set({ showDeleteModal: show }),
  setDatabaseToDelete: (id) => set({ databaseToDelete: id }),

  deleteDatabase: async (token) => {
    const { databaseToDelete, fetchDatabases } = get();
    try {
      await axios.delete(`/api/databases/${databaseToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ showDeleteModal: false, databaseToDelete: null });
      await fetchDatabases(token);
    } catch (error) {
      console.error("Failed to delete database:", error);
      toast.error("Failed to delete database. Please try again.");
    }
  },
}));

export default useDatabaseStore;
