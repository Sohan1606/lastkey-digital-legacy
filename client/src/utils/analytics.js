// PostHog Analytics Integration
let posthog = null;

// Initialize PostHog
export const initAnalytics = () => {
  try {
    if (import.meta.env.VITE_POSTHOG_API_KEY) {
      // Dynamically import PostHog only if API key exists
      import('posthog-js').then(({ default: PostHog }) => {
        posthog = new PostHog(import.meta.env.VITE_POSTHOG_API_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          debug: import.meta.env.DEV
        });

        // PostHog initialized successfully
      }).catch(err => {
        // PostHog initialization failed
      });
    } else {
      // PostHog not available
    }
  } catch (error) {
    // Error initializing PostHog
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (posthog) {
    posthog.capture(eventName, properties);
    // Event tracked
  }
};

// Track page views
export const trackPageView = (pageName, properties = {}) => {
  if (posthog) {
    posthog.capture('$pageview', {
      page: pageName,
      ...properties
    });
    // Event tracked
  }
};

// Track user engagement
export const trackEngagement = (action, details = {}) => {
  if (posthog) {
    posthog.capture('user_engagement', {
      action,
      ...details
    });
    // Event tracked
  }
};

// Track feature usage
export const trackFeatureUsage = (featureName, properties = {}) => {
  if (posthog) {
    posthog.capture('feature_used', {
      feature: featureName,
      ...properties
    });
    // Event tracked
  }
};

// Track conversion events
export const trackConversion = (conversionType, properties = {}) => {
  if (posthog) {
    posthog.capture('conversion', {
      type: conversionType,
      ...properties
    });
    // Event tracked
  }
};

// Track errors
export const trackError = (errorType, errorDetails = {}) => {
  if (posthog) {
    posthog.capture('error', {
      type: errorType,
      ...errorDetails
    });
    // Event tracked
  }
};

// Set user properties
export const setUserProperties = (properties) => {
  if (posthog) {
    posthog.people.set(properties);
    // Event tracked
  }
};

// Identify user
export const identifyUser = (userId, properties = {}) => {
  if (posthog) {
    posthog.identify(userId, properties);
    // Event tracked
  }
};

// Reset user
export const resetUser = () => {
  if (posthog) {
    posthog.reset();
  }
};

export { posthog };
