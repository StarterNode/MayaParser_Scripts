// ========== jsonParser.js ==========
// JSON flattening logic - converts nested mayaIntake.json to flat rows

/**
 * Main function to flatten intake JSON into spreadsheet rows
 * @param {Object} intakeData - Parsed mayaIntake JSON
 * @returns {Object} Object containing rows array and metadata
 */
function flattenIntakeJSON(intakeData) {
  const rows = [];
  
  // Iterate through sections
  intakeData.conversation_flow.sections.forEach(section => {
    // Process each question in section
    section.questions.forEach(question => {
      // Handle special types
      if (isComplexType(question.type)) {
        // Process complex types into multiple rows
        const complexRows = processComplexType(question, section);
        rows.push(...complexRows);
      } else {
        // Process standard question
        const row = processStandardQuestion(question, section);
        rows.push(row);
      }
    });
  });
  
  // Return object with rows instead of plain array
  return {
    rows: rows,
    sectionCount: intakeData.conversation_flow.sections.length
  };
}

/**
 * Check if question type needs special handling
 * @param {string} type - Question type
 * @returns {boolean}
 */
function isComplexType(type) {
  const complexTypes = [
    'service_object',
    'testimonial_object',
    'social_links_object',
    'text_array',
    'file_upload'
  ];
  return complexTypes.includes(type);
}

/**
 * Process standard question into single row
 * @param {Object} question - Question object
 * @param {Object} section - Parent section
 * @returns {Array} Single row array
 */
function processStandardQuestion(question, section) {
  return [
    section.section_id || '',
    section.section_name || '',
    question.id || '',
    question.question || '',
    question.context || '',
    question.type || 'text',
    question.required !== undefined ? question.required : true,
    formatValidation(question.validation),
    formatMapsTo(question.maps_to),
    question.default || '',
    formatExamples(question.examples),
    formatOptions(question.options)
  ];
}

/**
 * Process complex types into multiple rows
 * @param {Object} question - Complex question object
 * @param {Object} section - Parent section
 * @returns {Array} Array of row arrays
 */
function processComplexType(question, section) {
  const rows = [];
  
  // Add parent row first
  rows.push(processStandardQuestion(question, section));
  
  // Handle service_object and testimonial_object
  if (question.type === 'service_object' || question.type === 'testimonial_object') {
    if (question.fields) {
      Object.entries(question.fields).forEach(([fieldName, fieldConfig]) => {
        rows.push([
          section.section_id || '',
          section.section_name || '',
          `${question.id}.${fieldName}`,
          `${question.question} - ${fieldName}`,
          question.context || '',
          fieldConfig.type || 'text',
          fieldConfig.required || false,
          formatValidation(fieldConfig.validation || fieldConfig.max_length),
          `${formatMapsTo(question.maps_to)}.${fieldName}`,
          fieldConfig.default || '',
          '',
          ''
        ]);
      });
    }
  }
  
  // Handle social_links_object
  if (question.type === 'social_links_object' && question.fields) {
    Object.entries(question.fields).forEach(([platform, config]) => {
      rows.push([
        section.section_id || '',
        section.section_name || '',
        `${question.id}.${platform}`,
        `${question.question} - ${platform}`,
        question.context || '',
        config.type || 'url',
        config.required || false,
        'format: url',
        `${formatMapsTo(question.maps_to)}.${platform}`,
        '',
        '',
        ''
      ]);
    });
  }
  
  // Handle text_array
  if (question.type === 'text_array') {
    // Update validation to include max_items
    const parentRow = rows[0];
    parentRow[7] = `max_items: ${question.max_items || 10}, ${parentRow[7]}`;
  }
  
  // Handle file_upload
  if (question.type === 'file_upload') {
    // Update validation to include file constraints
    const parentRow = rows[0];
    const fileValidation = [];
    if (question.file_types) {
      fileValidation.push(`file_types: ${question.file_types.join(',')}`);
    }
    if (question.max_size) {
      fileValidation.push(`max_size: ${question.max_size}`);
    }
    parentRow[7] = fileValidation.join(', ');
  }
  
  return rows;
}

/**
 * Format validation rules
 * @param {*} validation - Validation rules (string or object)
 * @returns {string} Formatted validation string
 */
function formatValidation(validation) {
  if (!validation) return '';
  
  if (typeof validation === 'string') {
    return validation;
  }
  
  if (typeof validation === 'number') {
    return `max_length: ${validation}`;
  }
  
  if (typeof validation === 'object') {
    return Object.entries(validation)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }
  
  return '';
}

/**
 * Format maps_to field
 * @param {*} mapsTo - String or array of mapping targets
 * @returns {string} Comma-separated string
 */
function formatMapsTo(mapsTo) {
  if (!mapsTo) return '';
  
  if (Array.isArray(mapsTo)) {
    return mapsTo.join(', ');
  }
  
  return String(mapsTo);
}

/**
 * Format examples array
 * @param {*} examples - Examples array
 * @returns {string} Pipe-separated string
 */
function formatExamples(examples) {
  if (!examples) return '';
  
  if (Array.isArray(examples)) {
    return examples.join(' | ');
  }
  
  return String(examples);
}

/**
 * Format options for select fields
 * @param {*} options - Options array or object
 * @returns {string} Pipe-separated string
 */
function formatOptions(options) {
  if (!options) return '';
  
  if (Array.isArray(options)) {
    // Handle array of strings
    if (typeof options[0] === 'string') {
      return options.join(' | ');
    }
    // Handle array of objects
    if (typeof options[0] === 'object') {
      return options.map(opt => opt.value || opt.label).join(' | ');
    }
  }
  
  return '';
}