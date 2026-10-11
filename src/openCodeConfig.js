// src/openCodeConfig.js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Load OpenCode template and replace placeholders with values from environment or config.
 * @param {string} templatePath - Path to the template file.
 * @param {Object} values - Object containing placeholder keys and their replacement values.
 * @returns {Promise<Object>} Parsed configuration object.
 */
export async function loadOpenCodeConfig(templatePath, values = {}) {
  const template = await readFile(templatePath, 'utf8');
  // Simple placeholder replacement: {{key}} -> values[key]
  let content = template;
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{{${key}}}`;
    const regex = new RegExp(placeholder, 'g');
    content = content.replace(regex, value);
  }
  return JSON.parse(content);
}

/**
 * Generate OpenCode agent configuration for a specific agent type.
 * @param {string} agentType - Type of agent (lead, coder, tester, fixer, reviewer, documenter, pr-writer).
 * @param {Object} baseConfig - Base configuration from template.
 * @returns {Object} Configuration for the specific agent.
 */
export function getAgentConfig(agentType, baseConfig) {
  // In a real implementation, this might adjust the config based on agent type.
  // For now, we return the base config as OpenCode agents share the same base config.
  return { ...baseConfig, agentType };
}