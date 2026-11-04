import deepClone from './deep-clone';

export const createQualityPreset = (defaults, quality) => {
  const options = deepClone(defaults);
  options.target = 'html';
  options.interpolation = quality === 'high';
  options.highQualityPen = quality === 'high';
  options.resizeMode = 'preserve-ratio';
  options.autoplay = true;
  options.cursor.type = 'auto';
  options.controls = {
    greenFlag: {enabled: false},
    stopAll: {enabled: false},
    pause: {enabled: false},
    fullscreen: {enabled: false}
  };
  return options;
};

export const identifyQualityPreset = (options, defaults) => {
  const serialized = JSON.stringify(options);
  return ['high', 'medium'].find(quality =>
    serialized === JSON.stringify(createQualityPreset(defaults, quality))) || null;
};
