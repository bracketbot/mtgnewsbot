'use strict';

const tracery = require(`tracery-grammar`);

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
	constructor(text, tags) {
		this.text = text;
		if (tags) {
			this.tags = tags;
		}
		Object.freeze(this);
	}
}

const dynamicValueParsers = {
	dayOfTheWeek: () => new Date().toLocaleString('en-us', { weekday: 'long' })
};

function parseDynamicValues(message, dynamicTags) {
	[].concat(dynamicTags).forEach(tag => {
		if (!dynamicValueParsers[tag.name]) {
			throw new Error('Dynamic tag "' + tag.name + '" not recognized.');
		}
		message = message.replace(tag.rawTag, dynamicValueParsers[tag.name](tag.rawTag));		
	});
	return message;
}

function parseMessage(message) {
	let tags = undefined;
	let text = message;

	let match = message.match(/\{\w+?\s+?.*?\}/g);
	if (match) {
		tags = {};
		match.forEach(match => {
			const tag = match.match(/\{(\w+)\s/)[1];
			const parsedTag = match.match(/(\w+=".*?")/g).reduce((result, next) => {
					let key = next.match(/(\w+)=/)[1];
					let value = next.match(/="(.*)"/)[1];
					result[key] = value;
					return result;
				}, { rawTag: match });
	
			if (!tags[tag]) {
				tags[tag] = parsedTag;
			} else {
				tags[tag] = [tags[tag]];
				tags[tag].push(parsedTag);
			}

			if (tags['dynamicValue']) {
				message = parseDynamicValues(message, tags['dynamicValue']);
			}

			text = message.replace(match,'');
		});

    // Further process svg tags
    if (tags.svg && tags.svg.svgString) {
      tags.svg.svgString = tags.svg.svgString
          .replace(/`/g, '"')													// This gets quotes working
          .replace(/<</g, '{').replace(/>>/g, '}');
    }

    // Further process htmlimg tags
		if (tags.htmlImg && tags.htmlImg.htmlImgString) {
			tags.htmlImg.htmlImgString = tags.htmlImg.htmlImgString
				.replace(/`/g, '"')																		// This gets quotes working
				.replace(/<</g, '{').replace(/>>/g, '}');     	 			// This gets curly braces working
    }
	}

	return new Headline(text.trim().replace(/\s+/g,' '), tags);
}
