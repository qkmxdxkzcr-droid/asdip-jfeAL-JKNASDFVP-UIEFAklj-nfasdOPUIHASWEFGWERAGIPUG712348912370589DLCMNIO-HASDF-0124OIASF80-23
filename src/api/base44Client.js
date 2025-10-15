// Mock API client for base44
export const base44 = {
  entities: {
    Project: {
      list: async (sort) => [],
      get: async (id) => null,
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true,
      filter: async (query, sort) => []
    },
    Task: {
      list: async (sort) => [],
      get: async (id) => null,
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true,
      filter: async (query, sort) => [],
      bulkCreate: async (tasks) => tasks.map(task => ({ id: Date.now(), ...task }))
    },
    PlanTemplate: {
      list: async (sort) => [],
      get: async (id) => null,
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true,
      filter: async (query, sort) => []
    },
    DayPlan: {
      list: async (sort) => [],
      get: async (id) => null,
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true,
      filter: async (query, sort) => []
    },
    ScheduleItem: {
      list: async (sort) => [],
      get: async (id) => null,
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
      delete: async (id) => true,
      filter: async (query, sort) => []
    }
  },
  auth: {
    logout: () => {
      console.log('Logout called');
    }
  }
};
