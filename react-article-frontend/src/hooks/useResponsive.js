import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../utils/constants';

/**
 * Custom hook for responsive breakpoint detection
 * @returns {Object} Responsive state with breakpoint information
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      // Determine current breakpoint
      if (width < BREAKPOINTS.MOBILE) {
        setBreakpoint('mobile');
      } else if (width < BREAKPOINTS.TABLET) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    // Window dimensions
    width: windowSize.width,
    height: windowSize.height,
    
    // Current breakpoint
    breakpoint,
    
    // Boolean helpers
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    
    // Responsive helpers
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
    isTabletOrDesktop: breakpoint === 'tablet' || breakpoint === 'desktop',
    
    // Specific width checks
    isSmallScreen: windowSize.width < BREAKPOINTS.MOBILE,
    isMediumScreen: windowSize.width >= BREAKPOINTS.MOBILE && windowSize.width < BREAKPOINTS.TABLET,
    isLargeScreen: windowSize.width >= BREAKPOINTS.TABLET,
    isExtraLargeScreen: windowSize.width >= BREAKPOINTS.DESKTOP,
    
    // Orientation (for mobile devices)
    isPortrait: windowSize.height > windowSize.width,
    isLandscape: windowSize.width > windowSize.height,
  };
};

/**
 * Custom hook for media query matching
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

/**
 * Predefined media query hooks for common breakpoints
 */
export const useIsMobile = () => useMediaQuery(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`);
export const useIsTablet = () => useMediaQuery(`(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET - 1}px)`);
export const useIsDesktop = () => useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET}px)`);

export default useResponsive;