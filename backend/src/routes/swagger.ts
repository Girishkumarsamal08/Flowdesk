import express from 'express';
import { PrismaClient } from '@prisma/client';
import yaml from 'js-yaml';
import { authenticate } from './company.js';

const router = express.Router();
const prisma = new PrismaClient();

interface ExtractedParameter {
  name: string;
  in: string; // 'path', 'query', 'header', 'body'
  required: boolean;
  type: string;
}

interface ExtractedEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: ExtractedParameter[];
  requestBodyFields?: string[];
}

// Function to parse the swagger document and extract endpoints
export function parseSwaggerDocument(rawContent: string): { endpoints: ExtractedEndpoint[], error?: string } {
  try {
    let doc: any;
    
    // Check if it is JSON or YAML
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      doc = JSON.parse(trimmed);
    } else {
      doc = yaml.load(trimmed);
    }

    if (!doc || typeof doc !== 'object') {
      return { endpoints: [], error: 'Invalid Swagger/OpenAPI document structure' };
    }

    const endpoints: ExtractedEndpoint[] = [];
    const paths = doc.paths || {};

    Object.keys(paths).forEach((path) => {
      const pathObj = paths[path];
      Object.keys(pathObj).forEach((method) => {
        // Skip keys like parameters that are global to path
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
          const operation = pathObj[method];
          const description = operation.description || operation.summary || `Execute ${method.toUpperCase()} ${path}`;
          const parameters: ExtractedParameter[] = [];

          // Parse parameters (query / path / header)
          const operationParams = operation.parameters || [];
          const pathParams = pathObj.parameters || [];
          const allParams = [...operationParams, ...pathParams];

          allParams.forEach((param: any) => {
            parameters.push({
              name: param.name,
              in: param.in || 'query',
              required: !!param.required,
              type: param.schema?.type || param.type || 'string'
            });
          });

          // Parse requestBody fields for POST/PUT/PATCH
          const requestBodyFields: string[] = [];
          if (operation.requestBody) {
            const content = operation.requestBody.content || {};
            const jsonSchema = content['application/json']?.schema || {};
            
            if (jsonSchema.properties) {
              Object.keys(jsonSchema.properties).forEach((prop) => {
                requestBodyFields.push(prop);
              });
            }
          }

          endpoints.push({
            path,
            method: method.toUpperCase(),
            description,
            parameters,
            requestBodyFields
          });
        }
      });
    });

    return { endpoints };
  } catch (err: any) {
    console.error("Swagger Parsing Error:", err);
    return { endpoints: [], error: err.message || 'Parsing error' };
  }
}

// @route   POST /api/swagger/parse
// @desc    Step B: Ingest Swagger JSON/YAML, parse and update internal registry
router.post('/parse', authenticate, async (req: any, res) => {
  try {
    const { swaggerSchema } = req.body;

    if (!swaggerSchema) {
      return res.status(400).json({ message: 'Missing swaggerSchema payload' });
    }

    const { endpoints, error } = parseSwaggerDocument(swaggerSchema);

    if (error) {
      return res.status(400).json({ message: 'Failed to parse Swagger Schema', error });
    }

    // Save to Company DB
    await prisma.company.update({
      where: { id: req.companyId },
      data: {
        swaggerSchema,
        parsedEndpoints: endpoints as any // Save parsed endpoints in DB as Json
      }
    });

    res.json({
      message: 'Swagger Schema parsed and endpoints registered successfully',
      count: endpoints.length,
      endpoints
    });
  } catch (err: any) {
    console.error("Swagger Endpoints Save Error:", err);
    res.status(500).json({ message: 'Server error parsing swagger', error: err.message });
  }
});

export default router;
