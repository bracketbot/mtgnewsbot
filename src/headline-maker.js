'use strict';

const tracery = require(`tracery-grammar`);
const path = require('path');

class HeadlineMaker {

  constructor(grammar) {
    this.grammar = tracery.createGrammar(grammar);
    this.grammar.addModifiers(tracery.baseEngModifiers);
    this.origin = `#origin#`;
  }

  /**
   * Generates a headline and returns a headline object in the following format:
   */
  generateHeadline(customOrigin) {
    return parseMessage(this.grammar.flatten(customOrigin || this.origin));
  }

  /**
   * Generates a headline and returns its text contents, with any tags stripped out
   */
  generateTextHeadline(customOrigin) {
    return this.generateHeadline(customOrigin).text;
  }
}

module.exports = HeadlineMaker;

/**
 * Object representation of a headline, with the format:
 * {
 *		text {string}: text of the headline, with any tags stripped out, as a string
 * 		tags {Object}: a map of tags and their attributes, if the headline contains any. otherwise undefined.
 * }
 *
 * Expected tag format is {tagname attr1="one" attr2="two"} and is parsed as
 *	tagname: {
 *		attr1: "one",
 * 		attr2 = "two"
 *  }
 */
class Headline {
  constructor(text, tags, altText) {
    this.text = text;
    this.altText = altText;
    if (tags) {
      this.tags = tags;
    }
    Object.freeze(this);
  }
}

function parseMessage(message) {
  let tags = {};
  let altText = `MTG Image`;
  const ENDL_MARKER = `|`;
  message = message.split('\n').join(ENDL_MARKER);  // Support multiline strings from YAML
  let text = message;

  let match = message.match(/\{\w+?\s+?.*\}/g);
  if (match) {
    match.forEach(match => {
      const tag = match.match(/\{(\w+)\s/)[1];

      if (!tags[tag]) {
        tags[tag] = match.match(/(\w+=`.*?`)/g).reduce((result, next) => {
          let key = next.match(/(\w+)=/)[1];
          let value = next.match(/=`(.*?)`/)[1];
          result[key] = value;
          return result;
        }, {});
      }
      text = message.replace(match, '').replace(ENDL_MARKER, '').trim();
    });

    // Further process svg tags
    if (tags.svg && tags.svg.svgString) {
      tags.svg.svgString = tags.svg.svgString
        .split(ENDL_MARKER).join('\n')              // Restore endlines from before
        .replace(/`/g, '"')													// This gets quotes working
        .replace(/<</g, '{').replace(/>>/g, '}');
    }

    // Further process htmlimg tags
    if (tags.htmlImg && tags.htmlImg.htmlImgString) {
      tags.htmlImg.htmlImgString = tags.htmlImg.htmlImgString
        .split(ENDL_MARKER).join('\n')                        // Restore endlines from before
        .replace(/`/g, '"')																		// This gets quotes working
        .replace(/<</g, '{').replace(/>>/g, '}');     	 			// This gets curly braces working

      // Patch up CSS file paths
      tags.htmlImg.htmlImgString = resolveCssUrls(tags.htmlImg.htmlImgString);
      // Get the alt text out of it
      altText = tags.htmlImg.altText || altText;
    }
  }

  text = text.trim().replace(/\s+/g,' ');

  return new Headline(text, tags, altText);
}

function resolveCssUrls(html) {
  var newHtml = html.toString();

  function fileUrl(url) {
    var pathName = path.resolve(url).replace(/\\/g, '/');
    // windows drive letters must be prefixed with a slash
    if (pathName[0] !== '/') {
      pathName = '/' + pathName;
    }
    return encodeURI('file://' + pathName);
  }

  const matches = newHtml.match(/url\(\..*?\)/g);
  if (!matches) {
    return html;
  }
  matches.forEach(match => {
    newHtml = newHtml.replace(match, 'url('+ fileUrl(match.match(/url\((\..*?)\)/)[1])  + ')');
  });
  return newHtml;
}
