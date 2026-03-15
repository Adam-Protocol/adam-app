/**
 * Guard against StacksProvider redefinition errors during HMR
 * 
 * This prevents the "Cannot redefine property: StacksProvider" error that occurs
 * when the Leather wallet extension tries to inject StacksProvider into the window
 * object during Next.js hot module reloading.
 * 
 * The issue happens because:
 * 1. Leather extension injects StacksProvider on page load
 * 2. Next.js HMR reloads the page without full refresh
 * 3. Leather tries to inject again but the property already exists
 * 4. Object.defineProperty throws because the property is non-configurable
 */

let isGuardInitialized = false;

export function initStacksProviderGuard() {
  if (typeof window === 'undefined' || isGuardInitialized) return;

  try {
    // Store the original defineProperty and defineProperties methods
    const originalDefineProperty = Object.defineProperty;
    const originalDefineProperties = Object.defineProperties;
    
    // Override Object.defineProperty to intercept StacksProvider definitions
    Object.defineProperty = function (obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
      // Only intercept StacksProvider on window object
      if (obj === window && prop === 'StacksProvider') {
        // Check if StacksProvider already exists
        if ('StacksProvider' in window) {
          console.log('[Stacks Guard] Prevented StacksProvider redefinition (HMR)');
          return obj;
        }
        // If it doesn't exist, allow the definition but make it configurable
        descriptor.configurable = true;
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };

    // Override Object.defineProperties to handle batch property definitions
    Object.defineProperties = function (obj: any, props: PropertyDescriptorMap) {
      // Only intercept if defining StacksProvider on window
      if (obj === window && props.StacksProvider) {
        // Check if StacksProvider already exists
        if ('StacksProvider' in window) {
          console.log('[Stacks Guard] Prevented StacksProvider redefinition via defineProperties (HMR)');
          // Remove StacksProvider from the props to define
          const { StacksProvider, ...otherProps } = props;
          if (Object.keys(otherProps).length > 0) {
            return originalDefineProperties.call(this, obj, otherProps);
          }
          return obj;
        }
        // If it doesn't exist, make it configurable
        if (props.StacksProvider) {
          props.StacksProvider.configurable = true;
        }
      }
      return originalDefineProperties.call(this, obj, props);
    };

    // Preserve the original methods for potential restoration
    (Object.defineProperty as any).__original = originalDefineProperty;
    (Object.defineProperties as any).__original = originalDefineProperties;

    isGuardInitialized = true;
    console.log('[Stacks Guard] Initialized successfully');
  } catch (error) {
    console.error('[Stacks Guard] Failed to initialize:', error);
  }
}

/**
 * Clean up the guard (useful for testing or manual cleanup)
 */
export function cleanupStacksProviderGuard() {
  if (typeof window === 'undefined' || !isGuardInitialized) return;

  try {
    const originalDefineProperty = (Object.defineProperty as any).__original;
    const originalDefineProperties = (Object.defineProperties as any).__original;

    if (originalDefineProperty) {
      Object.defineProperty = originalDefineProperty;
    }
    if (originalDefineProperties) {
      Object.defineProperties = originalDefineProperties;
    }

    isGuardInitialized = false;
    console.log('[Stacks Guard] Cleaned up successfully');
  } catch (error) {
    console.error('[Stacks Guard] Failed to cleanup:', error);
  }
}
