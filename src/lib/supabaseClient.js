import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrxqcclskvzelkaccfbu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyeHFjY2xza3Z6ZWxrYWNjZmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjY4ODMsImV4cCI6MjA5NjYwMjg4M30.EJ5jGsjjZr6q4nv0npOL-kaArCeTMymEeO_0NzB_WPo';

// Check if credentials are present
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key';

let supabase;

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('TOSBS ONBOARDING: Supabase initialized successfully!');
} else {
  console.warn('TOSBS ONBOARDING: Supabase credentials not found. Falling back to LocalStorage Database Emulator.');
  
  // Seed initial data helper
  const getLocalStorageData = (key, defaultVal = []) => {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(data);
  };

  const setLocalStorageData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Seed default HR profile
  getLocalStorageData('tosbs_hr_profiles', [
    { id: 'hr-1', email: 'admin@tosbs.com', full_name: 'Sarah Jenkins' }
  ]);

  // Query Builder Emulator to support Supabase chains like:
  // supabase.from('employees').select('*').eq('invite_token', token).single()
  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = `tosbs_${tableName}`;
      this.filters = [];
      this.isSingle = false;
      this.shouldOrder = false;
      this.orderField = '';
      this.orderAsc = false;
    }

    async getRawData() {
      const data = localStorage.getItem(this.tableName);
      return data ? JSON.parse(data) : [];
    }

    async saveRawData(data) {
      localStorage.setItem(this.tableName, JSON.stringify(data));
    }

    select(columns = '*') {
      // Returns builder for chaining
      return this;
    }

    eq(column, value) {
      this.filters.push({ column, value, type: 'eq' });
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    order(column, { ascending = false } = {}) {
      this.shouldOrder = true;
      this.orderField = column;
      this.orderAsc = ascending;
      return this;
    }

    async then(resolve) {
      try {
        let data = await this.getRawData();

        // Apply filters
        for (const filter of this.filters) {
          if (filter.type === 'eq') {
            data = data.filter(item => item[filter.column] === filter.value);
          }
        }

        // Apply ordering
        if (this.shouldOrder && this.orderField) {
          data.sort((a, b) => {
            const valA = a[this.orderField];
            const valB = b[this.orderField];
            if (valA < valB) return this.orderAsc ? -1 : 1;
            if (valA > valB) return this.orderAsc ? 1 : -1;
            return 0;
          });
        }

        if (this.isSingle) {
          if (data.length === 0) {
            resolve({ data: null, error: { message: 'Row not found' } });
            return;
          }
          resolve({ data: data[0], error: null });
          return;
        }

        resolve({ data, error: null });
      } catch (err) {
        resolve({ data: null, error: err });
      }
    }

    async insert(newRow) {
      try {
        const rows = Array.isArray(newRow) ? newRow : [newRow];
        const currentData = await this.getRawData();
        
        const createdRows = rows.map(r => ({
          id: r.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...r
        }));

        const updatedData = [...currentData, ...createdRows];
        await this.saveRawData(updatedData);

        return { data: Array.isArray(newRow) ? createdRows : createdRows[0], error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    async update(updatedFields) {
      try {
        let currentData = await this.getRawData();
        let affected = [];

        currentData = currentData.map(item => {
          // Check if filters match
          let matches = true;
          for (const filter of this.filters) {
            if (filter.type === 'eq' && item[filter.column] !== filter.value) {
              matches = false;
              break;
            }
          }

          if (matches) {
            const updatedItem = {
              ...item,
              ...updatedFields,
              updated_at: new Date().toISOString()
            };
            affected.push(updatedItem);
            return updatedItem;
          }
          return item;
        });

        await this.saveRawData(currentData);
        return { data: this.isSingle ? affected[0] : affected, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    async upsert(row) {
      try {
        const currentData = await this.getRawData();
        const rows = Array.isArray(row) ? row : [row];
        let affected = [];

        const updatedData = [...currentData];

        for (const r of rows) {
          // Find if we have a match based on ID or unique fields (employee_id for detailed views)
          const index = updatedData.findIndex(item => 
            (r.id && item.id === r.id) || 
            (r.employee_id && item.employee_id === r.employee_id)
          );

          const newObj = {
            id: r.id || (index >= 0 ? updatedData[index].id : crypto.randomUUID()),
            created_at: index >= 0 ? updatedData[index].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...r
          };

          if (index >= 0) {
            updatedData[index] = newObj;
          } else {
            updatedData.push(newObj);
          }
          affected.push(newObj);
        }

        await this.saveRawData(updatedData);
        return { data: Array.isArray(row) ? affected : affected[0], error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }

    async delete() {
      try {
        let currentData = await this.getRawData();
        const initialLength = currentData.length;

        currentData = currentData.filter(item => {
          let matches = true;
          for (const filter of this.filters) {
            if (filter.type === 'eq' && item[filter.column] !== filter.value) {
              matches = false;
              break;
            }
          }
          return !matches; // Keep non-matching rows
        });

        await this.saveRawData(currentData);
        return { data: { count: initialLength - currentData.length }, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }
  }

  supabase = {
    isMock: true,
    from(tableName) {
      return new MockQueryBuilder(tableName);
    }
  };
}

export default supabase;
