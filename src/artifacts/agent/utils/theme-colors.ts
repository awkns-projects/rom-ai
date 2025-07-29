/**
 * Consistent color themes for Models, Actions, and Schedules
 * Use these constants to maintain color consistency across the application
 */

export const THEME_COLORS = {
  models: {
    // Green theme for Models
    background: 'bg-green-500/10',
    border: 'border-green-500/20',
    borderHover: 'hover:border-green-500/40',
    borderFocus: 'focus:border-green-400',
    borderAccent: 'border-green-500/30',
    ring: 'focus:ring-green-400/20',
    
    text: {
      primary: 'text-green-200',
      secondary: 'text-green-300',
      accent: 'text-green-400',
      muted: 'text-green-500',
      placeholder: 'placeholder-green-500/50'
    },
    
    icon: {
      background: 'bg-green-500/20',
      border: 'border-green-500/30'
    },
    
    button: {
      primary: 'bg-green-600 hover:bg-green-700',
      secondary: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30'
    },
    
    badge: 'bg-green-800/50 border-green-700',
    
    ai: {
      background: 'bg-green-500/20',
      border: 'border-green-400/30',
      text: 'text-green-300',
      indicator: 'bg-green-400'
    }
  },
  
  actions: {
    // Blue theme for Actions
    background: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    borderHover: 'hover:border-blue-500/40',
    borderFocus: 'focus:border-blue-400',
    borderAccent: 'border-blue-500/30',
    ring: 'focus:ring-blue-400/20',
    
    text: {
      primary: 'text-blue-200',
      secondary: 'text-blue-300',
      accent: 'text-blue-400',
      muted: 'text-blue-500',
      placeholder: 'placeholder-blue-500/50'
    },
    
    icon: {
      background: 'bg-blue-500/20',
      border: 'border-blue-500/30'
    },
    
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30'
    },
    
    badge: 'bg-blue-800/50 border-blue-700',
    
    ai: {
      background: 'bg-blue-500/20',
      border: 'border-blue-400/30',
      text: 'text-blue-300',
      indicator: 'bg-blue-400'
    }
  },
  
  schedules: {
    // Orange theme for Schedules
    background: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    borderHover: 'hover:border-orange-500/40',
    borderFocus: 'focus:border-orange-400',
    borderAccent: 'border-orange-500/30',
    ring: 'focus:ring-orange-400/20',
    
    text: {
      primary: 'text-orange-200',
      secondary: 'text-orange-300',
      accent: 'text-orange-400',
      muted: 'text-orange-500',
      placeholder: 'placeholder-orange-500/50'
    },
    
    icon: {
      background: 'bg-orange-500/20',
      border: 'border-orange-500/30'
    },
    
    button: {
      primary: 'bg-orange-600 hover:bg-orange-700',
      secondary: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30'
    },
    
    badge: 'bg-orange-800/50 border-orange-700',
    
    ai: {
      background: 'bg-orange-500/20',
      border: 'border-orange-400/30',
      text: 'text-orange-300',
      indicator: 'bg-orange-400'
    }
  }
} as const;

/**
 * Helper function to get theme colors for a specific component type
 */
export function getThemeColors(type: 'models' | 'actions' | 'schedules') {
  return THEME_COLORS[type];
}

/**
 * Helper function to get AI generation effect styles for a specific component type
 */
export function getAIGenerationStyles(type: 'models' | 'actions' | 'schedules') {
  const colors = THEME_COLORS[type];
  const rgbValues = {
    models: '34, 197, 94',    // green-500 RGB
    actions: '59, 130, 246',  // blue-500 RGB  
    schedules: '249, 115, 22' // orange-500 RGB
  };
  
  return `
    relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-r 
    before:from-transparent before:via-${type === 'models' ? 'green' : type === 'actions' ? 'blue' : 'orange'}-500/20 before:to-transparent
    before:translate-x-[-100%] before:animate-[shimmer_2s_infinite]
    ${colors.borderAccent.replace('border-', 'border-').replace('/30', '/40')} shadow-[0_0_20px_rgba(${rgbValues[type]},0.3)]
    animate-pulse
  `;
} 