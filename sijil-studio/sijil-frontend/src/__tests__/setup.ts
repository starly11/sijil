import '@testing-library/jest-dom';

global.ResizeObserver = require('resize-observer-polyfill');

global.IntersectionObserver = class IntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
};
