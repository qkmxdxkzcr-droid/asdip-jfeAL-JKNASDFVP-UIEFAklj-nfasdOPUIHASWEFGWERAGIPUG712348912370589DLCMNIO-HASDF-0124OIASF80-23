// Task import functionality
import { tasks, projects } from './store.js';

/**
 * Parse import text and create tasks
 * @param {string} text - Import text
 * @returns {Array} Array of parsed tasks
 */
export function parseImportText(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const parsedTasks = [];
  let currentProject = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for project context
    if (trimmed.startsWith('Project:')) {
      const projectName = trimmed.replace('Project:', '').trim();
      currentProject = projectName;
      continue;
    }
    
    // Parse task
    const task = parseTaskLine(trimmed, currentProject);
    if (task) {
      parsedTasks.push(task);
    }
  }
  
  return parsedTasks;
}

/**
 * Parse a single task line
 * @param {string} line - Task line
 * @param {string} projectName - Current project name
 * @returns {Object|null} Parsed task or null
 */
function parseTaskLine(line, projectName) {
  // Format 1: Task @30m #P2
  // Format 2: [U I6 R3] Chemistry @30m #P1
  // Format 3: Project: German #P2 @30m (already handled above)
  
  const task = {
    id: generateId(),
    title: '',
    minutes: null,
    priority: null,
    type: null,
    coeff: {},
    projectId: null,
    done: false,
    createdAt: Date.now()
  };
  
  // Extract coefficients [U I6 R3]
  const coeffMatch = line.match(/^\[([UMFSRA])\s+([IRP])(\d+)\s+([IRP])(\d+)\s+([IRP])(\d+)\]/);
  if (coeffMatch) {
    task.type = coeffMatch[1];
    task.coeff[coeffMatch[2]] = parseInt(coeffMatch[3]);
    task.coeff[coeffMatch[4]] = parseInt(coeffMatch[5]);
    task.coeff[coeffMatch[6]] = parseInt(coeffMatch[7]);
    line = line.replace(coeffMatch[0], '').trim();
  }
  
  // Extract minutes @30m
  const minutesMatch = line.match(/@(\d+)m?/);
  if (minutesMatch) {
    task.minutes = parseInt(minutesMatch[1]);
    line = line.replace(minutesMatch[0], '').trim();
  }
  
  // Extract priority #P2
  const priorityMatch = line.match(/#(P[1-4])/);
  if (priorityMatch) {
    task.priority = priorityMatch[1];
    line = line.replace(priorityMatch[0], '').trim();
  }
  
  // Extract project #ProjectName
  const projectMatch = line.match(/#([A-Za-z][A-Za-z0-9\s]*)/);
  if (projectMatch) {
    const projectName = projectMatch[1].trim();
    task.projectId = projectName; // Will be resolved to actual ID later
    line = line.replace(projectMatch[0], '').trim();
  }
  
  // Use project context if no project specified
  if (!task.projectId && projectName) {
    task.projectId = projectName;
  }
  
  // Remaining text is the title
  task.title = line.trim();
  
  // Validate task
  if (!task.title) {
    return null;
  }
  
  return task;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Resolve project names to IDs
 * @param {Array} tasks - Array of tasks
 * @returns {Array} Tasks with resolved project IDs
 */
export async function resolveProjectIds(tasks) {
  const projectMap = new Map();
  
  // Get all unique project names
  const projectNames = [...new Set(tasks.map(t => t.projectId).filter(Boolean))];
  
  // Create or find projects
  for (const projectName of projectNames) {
    let project = await findProjectByName(projectName);
    
    if (!project) {
      // Create new project
      project = {
        id: generateProjectId(),
        name: projectName,
        color: generateProjectColor(),
        createdAt: Date.now()
      };
      
      await projects.put(project);
    }
    
    projectMap.set(projectName, project.id);
  }
  
  // Update tasks with resolved project IDs
  return tasks.map(task => ({
    ...task,
    projectId: task.projectId ? projectMap.get(task.projectId) : null
  }));
}

/**
 * Find project by name
 * @param {string} name - Project name
 * @returns {Object|null} Project or null
 */
async function findProjectByName(name) {
  const allProjects = await projects.getAll();
  return allProjects.find(p => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Generate project ID
 * @returns {string} Project ID
 */
function generateProjectId() {
  return 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate project color
 * @returns {string} Hex color
 */
function generateProjectColor() {
  const colors = [
    '#7C4DFF', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9',
    '#8B5CF6', '#10B981', '#F97316', '#DC2626', '#3B82F6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Import tasks from text
 * @param {string} text - Import text
 * @returns {Object} Import result
 */
export async function importTasks(text) {
  try {
    // Parse tasks
    const parsedTasks = parseImportText(text);
    
    if (parsedTasks.length === 0) {
      return {
        success: false,
        message: 'No valid tasks found in import text',
        tasks: []
      };
    }
    
    // Resolve project IDs
    const resolvedTasks = await resolveProjectIds(parsedTasks);
    
    // Save tasks
    const savedTasks = [];
    for (const task of resolvedTasks) {
      await tasks.put(task);
      savedTasks.push(task);
    }
    
    return {
      success: true,
      message: `Successfully imported ${savedTasks.length} tasks`,
      tasks: savedTasks
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error.message}`,
      tasks: []
    };
  }
}

/**
 * Get import format examples
 * @returns {Array} Array of format examples
 */
export function getImportFormats() {
  return [
    {
      name: 'Simple Format',
      description: 'Task name with time and priority',
      example: 'Review documents @30m #P2',
      fields: ['title', 'minutes', 'priority']
    },
    {
      name: 'Detailed Format',
      description: 'Task with type and coefficients',
      example: '[U I6 R3] Chemistry homework @45m #P1',
      fields: ['type', 'coeff', 'title', 'minutes', 'priority']
    },
    {
      name: 'Project Context',
      description: 'Set project context for following tasks',
      example: 'Project: German Language\nLearn vocabulary @20m #P2\nPractice grammar @30m #P1',
      fields: ['project', 'title', 'minutes', 'priority']
    }
  ];
}

/**
 * Validate import text
 * @param {string} text - Import text
 * @returns {Object} Validation result
 */
export function validateImportText(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const errors = [];
  const warnings = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for empty lines
    if (!line.trim()) {
      continue;
    }
    
    // Check for project context
    if (line.startsWith('Project:')) {
      const projectName = line.replace('Project:', '').trim();
      if (!projectName) {
        errors.push(`Line ${lineNum}: Project name cannot be empty`);
      }
      continue;
    }
    
    // Check for valid task format
    const task = parseTaskLine(line, null);
    if (!task) {
      errors.push(`Line ${lineNum}: Invalid task format`);
      continue;
    }
    
    // Check for required fields
    if (!task.title) {
      errors.push(`Line ${lineNum}: Task title is required`);
    }
    
    if (!task.minutes) {
      warnings.push(`Line ${lineNum}: No time specified, will use default`);
    }
    
    if (!task.priority) {
      warnings.push(`Line ${lineNum}: No priority specified, will use default`);
    }
    
    // Check for valid coefficients
    if (task.coeff && Object.keys(task.coeff).length > 0) {
      for (const [key, value] of Object.entries(task.coeff)) {
        if (value < 0 || value > 10) {
          errors.push(`Line ${lineNum}: Coefficient ${key} must be between 0 and 10`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    taskCount: lines.filter(line => line.trim() && !line.startsWith('Project:')).length
  };
}

// Export default
export default {
  parseImportText,
  resolveProjectIds,
  importTasks,
  getImportFormats,
  validateImportText
};
