module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets');
  return {
    dir: { input: 'site', includes: '_includes', data: '_data', output: 'dist' },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
};
