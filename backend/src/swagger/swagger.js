import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AI Doubt Management System (AIDMS) API',
    version: '1.0.0',
    description:
      'Production-oriented REST API for institutional doubt resolution, AI classification and semantic grouping, faculty queue management, and real-time student support.'
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate student, faculty, or administrator',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'aarav.sharma@apex.edu' },
                  password: { type: 'string', example: 'Student@123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful with JWT access & refresh tokens' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        responses: {
          200: { description: 'User profile with role-specific details' }
        }
      }
    },
    '/api/student/dashboard': {
      get: {
        summary: 'Get student dashboard metrics and recent doubts',
        tags: ['Student'],
        responses: {
          200: { description: 'Student metrics, recent doubts, recommended articles' }
        }
      }
    },
    '/api/student/subjects': {
      get: {
        summary: 'Get enrolled subjects with syllabus topics for doubt submission',
        tags: ['Student'],
        responses: {
          200: { description: 'List of subjects and their syllabus topics' }
        }
      }
    },
    '/api/doubts': {
      post: {
        summary: 'Submit a new academic doubt (Normal or Anonymous mode)',
        tags: ['Doubts'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['classSubjectId', 'topic', 'title', 'questionText'],
                properties: {
                  classSubjectId: { type: 'string' },
                  subjectId: { type: 'string' },
                  topic: { type: 'string', example: 'Deadlock Detection' },
                  subtopic: { type: 'string', example: 'Banker Algorithm' },
                  title: { type: 'string', example: 'Banker algorithm safety check clarity' },
                  questionText: { type: 'string', example: 'How does the allocation matrix verify safe states?' },
                  privacyMode: { type: 'string', enum: ['normal', 'anonymous'], default: 'normal' },
                  priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Doubt created and routed to AI pipeline' }
        }
      }
    },
    '/api/doubts/my': {
      get: {
        summary: 'List logged-in student doubts with status filtering',
        tags: ['Doubts'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Paginated list of student doubts' }
        }
      }
    },
    '/api/doubts/{id}': {
      get: {
        summary: 'Get doubt details (Enforces privacy; anonymous identities masked for faculty)',
        tags: ['Doubts'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Doubt details, AI classifications, answers' },
          403: { description: 'Forbidden: Access to another student private doubt denied' }
        }
      }
    },
    '/api/faculty/dashboard': {
      get: {
        summary: 'Get faculty operational metrics, pending queue, and AI groups',
        tags: ['Faculty'],
        responses: {
          200: { description: 'Faculty dashboard statistics' }
        }
      }
    },
    '/api/faculty/doubts': {
      get: {
        summary: 'Get pending doubt queue for assigned classes (Strict anonymity masking)',
        tags: ['Faculty'],
        responses: {
          200: { description: 'Queue of doubts' }
        }
      }
    },
    '/api/faculty/doubt-groups': {
      get: {
        summary: 'Get AI semantic doubt groups for assigned subjects',
        tags: ['Faculty'],
        responses: {
          200: { description: 'List of doubt groups' }
        }
      }
    },
    '/api/faculty/doubt-groups/{id}/answers': {
      post: {
        summary: 'Publish shared answer to an entire doubt group',
        tags: ['Faculty'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string' },
                  publishToKnowledgeBase: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Answer published and all linked students notified' }
        }
      }
    },
    '/api/admin/analytics': {
      get: {
        summary: 'Get institutional analytics (volume, resolution times, workload, AI accuracy)',
        tags: ['Admin'],
        responses: {
          200: { description: 'Comprehensive institutional metrics' }
        }
      }
    },
    '/api/admin/audit-logs': {
      get: {
        summary: 'Review system audit logs for administrative security monitoring',
        tags: ['Admin'],
        responses: {
          200: { description: 'Audit log entries' }
        }
      }
    }
  }
};

export function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
