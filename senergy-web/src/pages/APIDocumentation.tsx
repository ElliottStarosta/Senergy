import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'
import { DashboardReturnBtn } from '@/components/common/DashboardReturnBtn'
import Snowfall from 'react-snowfall'

// Language configurations
const LANGUAGES: Record<string, { name: string; icon: string; color: string }> = {
  curl: { name: 'cURL', icon: 'fa-terminal', color: '#34D399' },
  python: { name: 'Python', icon: 'fa-python', color: '#3776AB' },
  javascript: { name: 'JavaScript', icon: 'fa-js-square', color: '#F7DF1E' },
  java: { name: 'Java', icon: 'fa-java', color: '#007396' },
  cpp: { name: 'C++', icon: 'fa-code', color: '#00599C' },
}

// Code generation functions
const generateCodeExample = (endpoint: any, language: string) => {
  const baseUrl = 'http://localhost:3001'

  switch (language) {
    case 'curl':
      return endpoint.example


    case 'python':
      return generatePythonCode(endpoint, baseUrl)

    case 'javascript':
      return generateJavaScriptCode(endpoint, baseUrl)

    case 'java':
      return generateJavaCode(endpoint, baseUrl)

    case 'cpp':
      return generateCppCode(endpoint, baseUrl)

    default:
      return endpoint.example
  }
}

const generatePythonCode = (endpoint: any, baseUrl: string) => {
  const requiresAuth = endpoint.headers?.some((h: any) => h.name === 'Authorization')
  const hasBody = endpoint.parameters.length > 0 && ['POST', 'PUT'].includes(endpoint.method)

  let code = `import requests\nimport json\n\n`

  if (requiresAuth) {
    code += `# Set your JWT token\ntoken = "your_jwt_token_here"\n`
    code += `headers = {\n    "Authorization": f"Bearer {token}",\n    "Content-Type": "application/json"\n}\n\n`
  } else if (hasBody) {
    code += `headers = {"Content-Type": "application/json"}\n\n`
  }

  if (hasBody) {
    code += `# Request payload\ndata = {\n`
    endpoint.parameters.slice(0, 3).forEach((param: any) => {
      const value = param.type === 'string' ? `"example_${param.name}"` :
        param.type.includes('[]') ? '[]' :
          param.type === 'object' ? '{}' : 'None'
      code += `    "${param.name}": ${value},\n`
    })
    code += `}\n\n`
  }

  const url = endpoint.path.includes(':') ?
    endpoint.path.replace(/:[^/]+/g, 'example_id') :
    endpoint.path

  code += `# Make the request\n`
  if (endpoint.method === 'GET') {
    code += `response = requests.get(\n    f"${baseUrl}${url}"`
    if (requiresAuth) code += `,\n    headers=headers`
    code += `\n)`
  } else {
    code += `response = requests.${endpoint.method.toLowerCase()}(\n    f"${baseUrl}${url}"`
    if (hasBody) code += `,\n    json=data`
    if (requiresAuth || hasBody) code += `,\n    headers=headers`
    code += `\n)`
  }

  code += `\n\n# Handle response\nif response.status_code == ${endpoint.statusCodes[0].code}:\n    result = response.json()\n    print("Success:", result)\nelse:\n    print(f"Error {response.status_code}:", response.text)`

  return code
}

const generateJavaScriptCode = (endpoint: any, baseUrl: string) => {
  const requiresAuth = endpoint.headers?.some((h: any) => h.name === 'Authorization')
  const hasBody = endpoint.parameters.length > 0 && ['POST', 'PUT'].includes(endpoint.method)

  let code = `// Using fetch API\n`

  if (requiresAuth) {
    code += `const token = "your_jwt_token_here";\n\n`
  }

  if (hasBody) {
    code += `const data = {\n`
    endpoint.parameters.slice(0, 3).forEach((param: any) => {
      const value = param.type === 'string' ? `"example_${param.name}"` :
        param.type.includes('[]') ? '[]' :
          param.type === 'object' ? '{}' : 'null'
      code += `  ${param.name}: ${value},\n`
    })
    code += `};\n\n`
  }

  const url = endpoint.path.includes(':') ?
    endpoint.path.replace(/:[^/]+/g, 'example_id') :
    endpoint.path

  code += `const response = await fetch("${baseUrl}${url}", {\n`
  code += `  method: "${endpoint.method}",\n`
  code += `  headers: {\n`
  if (requiresAuth) code += `    "Authorization": \`Bearer \${token}\`,\n`
  if (hasBody) code += `    "Content-Type": "application/json",\n`
  code += `  },\n`
  if (hasBody) code += `  body: JSON.stringify(data),\n`
  code += `});\n\n`

  code += `if (response.ok) {\n  const result = await response.json();\n  console.log("Success:", result);\n} else {\n  console.error("Error:", response.status, await response.text());\n}`

  return code
}

const generateJavaCode = (endpoint: any, baseUrl: string) => {
  const requiresAuth = endpoint.headers?.some((h: any) => h.name === 'Authorization')
  const hasBody = endpoint.parameters.length > 0 && ['POST', 'PUT'].includes(endpoint.method)

  let code = `import java.net.http.*;\nimport java.net.URI;\nimport com.google.gson.Gson;\nimport java.util.HashMap;\n\n`
  code += `public class APIExample {\n    public static void main(String[] args) throws Exception {\n`
  code += `        HttpClient client = HttpClient.newHttpClient();\n`

  if (requiresAuth) {
    code += `        String token = "your_jwt_token_here";\n`
  }

  const url = endpoint.path.includes(':') ?
    endpoint.path.replace(/:[^/]+/g, 'example_id') :
    endpoint.path

  if (hasBody) {
    code += `        \n        // Request payload\n`
    code += `        HashMap<String, Object> data = new HashMap<>();\n`
    endpoint.parameters.slice(0, 3).forEach((param: any) => {
      const value = param.type === 'string' ? `"example_${param.name}"` : 'null'
      code += `        data.put("${param.name}", ${value});\n`
    })
    code += `        String json = new Gson().toJson(data);\n`
  }

  code += `        \n        HttpRequest.Builder builder = HttpRequest.newBuilder()\n`
  code += `            .uri(URI.create("${baseUrl}${url}"))\n`
  if (requiresAuth) {
    code += `            .header("Authorization", "Bearer " + token)\n`
  }
  if (hasBody) {
    code += `            .header("Content-Type", "application/json")\n`
    code += `            .${endpoint.method}(HttpRequest.BodyPublishers.ofString(json));\n`
  } else {
    code += `            .${endpoint.method}(HttpRequest.BodyPublishers.noBody());\n`
  }

  code += `        \n        HttpResponse<String> response = client.send(\n`
  code += `            builder.build(),\n`
  code += `            HttpResponse.BodyHandlers.ofString()\n`
  code += `        );\n`
  code += `        \n        System.out.println("Status: " + response.statusCode());\n`
  code += `        System.out.println("Response: " + response.body());\n`
  code += `    }\n}`

  return code
}

const generateCppCode = (endpoint: any, baseUrl: string) => {
  const requiresAuth = endpoint.headers?.some((h: any) => h.name === 'Authorization')
  const hasBody = endpoint.parameters.length > 0 && ['POST', 'PUT'].includes(endpoint.method)

  let code = `#include <iostream>\n#include <curl/curl.h>\n#include <string>\n\n`
  code += `// Callback function for response\n`
  code += `size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {\n`
  code += `    size_t totalSize = size * nmemb;\n`
  code += `    output->append((char*)contents, totalSize);\n`
  code += `    return totalSize;\n}\n\n`
  code += `int main() {\n    CURL* curl = curl_easy_init();\n    std::string response;\n    \n`

  const url = endpoint.path.includes(':') ?
    endpoint.path.replace(/:[^/]+/g, 'example_id') :
    endpoint.path

  code += `    if (curl) {\n`
  code += `        curl_easy_setopt(curl, CURLOPT_URL, "${baseUrl}${url}");\n`
  code += `        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);\n`
  code += `        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);\n`

  if (endpoint.method !== 'GET') {
    code += `        curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${endpoint.method}");\n`
  }

  code += `        \n        struct curl_slist* headers = NULL;\n`
  if (requiresAuth) {
    code += `        headers = curl_slist_append(headers, "Authorization: Bearer your_token");\n`
  }
  if (hasBody) {
    code += `        headers = curl_slist_append(headers, "Content-Type: application/json");\n`
    code += `        std::string jsonData = R"({"key":"value"})";\n`
    code += `        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonData.c_str());\n`
  }
  code += `        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n`
  code += `        \n        CURLcode res = curl_easy_perform(curl);\n`
  code += `        if (res != CURLE_OK) {\n`
  code += `            std::cerr << "Request failed: " << curl_easy_strerror(res) << std::endl;\n`
  code += `        } else {\n`
  code += `            std::cout << "Response: " << response << std::endl;\n`
  code += `        }\n`
  code += `        \n        curl_slist_free_all(headers);\n`
  code += `        curl_easy_cleanup(curl);\n`
  code += `    }\n    return 0;\n}`

  return code
}

const getCodeComments = (endpoint: any, language: string): { [key: number]: string } => {
  const comments: { [key: number]: string } = {}

  // Get the actual code to analyze line by line
  const code = generateCodeExample(endpoint, language)
  const lines = code.split('\n')

  // Helper function to find parameter description
  const getParamDesc = (paramName: string): string => {
    const param = endpoint.parameters.find((p: any) => p.name === paramName)
    return param ? param.description : `${paramName} parameter`
  }

  lines.forEach((line: string, index: number) => {
    const trimmed = line.trim()
    
    // Skip empty lines and comment lines
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      return
    }

    // Language-specific parsing
    switch (language) {
      case 'curl':
        if (trimmed.startsWith('curl -X')) {
          comments[index] = `Execute ${endpoint.method} request to ${endpoint.name} endpoint`
        } else if (trimmed.includes('-H "Authorization:')) {
          comments[index] = 'Include JWT bearer token for authentication'
        } else if (trimmed.includes('-H "Content-Type:')) {
          comments[index] = 'Specify JSON format for request data'
        } else if (trimmed.includes('-d \'') || trimmed.includes('-d "')) {
          comments[index] = `Send request payload with ${endpoint.name.toLowerCase()} data`
        }
        break

      case 'python':
        if (trimmed.startsWith('import requests')) {
          comments[index] = 'Import HTTP library for API requests'
        } else if (trimmed.startsWith('import json')) {
          comments[index] = 'Import JSON module for data handling'
        } else if (trimmed.includes('token = ')) {
          comments[index] = 'Store JWT authentication token from login'
        } else if (trimmed === 'headers = {') {
          comments[index] = 'Configure request headers dictionary'
        } else if (trimmed.includes('"Authorization":') && trimmed.includes('Bearer')) {
          comments[index] = 'Add bearer token to authorization header'
        } else if (trimmed.includes('"Content-Type":') && trimmed.includes('json')) {
          comments[index] = 'Set content type to application/json'
        } else if (trimmed === '},') {
          comments[index] = 'Close headers configuration'
        } else if (trimmed === 'data = {') {
          comments[index] = `Build request payload for ${endpoint.name.toLowerCase()}`
        } else if (trimmed.includes(': "example_')) {
          // Extract parameter name from the line
          const match = trimmed.match(/"(\w+)":\s*"example_/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': []')) {
          const match = trimmed.match(/"(\w+)":\s*\[\]/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': {}')) {
          const match = trimmed.match(/"(\w+)":\s*\{\}/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': None')) {
          const match = trimmed.match(/"(\w+)":\s*None/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed === '}') {
          comments[index] = 'Close data payload dictionary'
        } else if (trimmed.startsWith('response = requests.get(')) {
          comments[index] = `Send GET request to ${endpoint.name} endpoint`
        } else if (trimmed.startsWith('response = requests.post(')) {
          comments[index] = `Send POST request to ${endpoint.name} endpoint`
        } else if (trimmed.startsWith('response = requests.put(')) {
          comments[index] = `Send PUT request to ${endpoint.name} endpoint`
        } else if (trimmed.startsWith('response = requests.delete(')) {
          comments[index] = `Send DELETE request to ${endpoint.name} endpoint`
        } else if (trimmed.startsWith('f"http')) {
          comments[index] = 'Specify target URL endpoint'
        } else if (trimmed.includes('json=data')) {
          comments[index] = 'Include JSON payload in request body'
        } else if (trimmed.includes('headers=headers')) {
          comments[index] = 'Attach configured headers to request'
        } else if (trimmed === ')') {
          comments[index] = 'Complete the request call'
        } else if (trimmed.includes('if response.status_code ==')) {
          comments[index] = `Check if response status is ${endpoint.statusCodes[0].code} (${endpoint.statusCodes[0].message.toLowerCase()})`
        } else if (trimmed.includes('result = response.json()')) {
          comments[index] = 'Parse JSON response into Python dictionary'
        } else if (trimmed.includes('print("Success"')) {
          comments[index] = 'Display successful operation result'
        } else if (trimmed.startsWith('else:')) {
          comments[index] = 'Handle non-success responses'
        } else if (trimmed.includes('print(f"Error')) {
          comments[index] = 'Display error status and message'
        }
        break

      case 'javascript':
        if (trimmed.includes('// Using fetch')) {
          return
        } else if (trimmed.includes('const token =')) {
          comments[index] = 'Store JWT authentication token'
        } else if (trimmed === 'const data = {') {
          comments[index] = `Build request payload for ${endpoint.name.toLowerCase()}`
        } else if (trimmed.includes(': "example_')) {
          const match = trimmed.match(/(\w+):\s*"example_/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': []')) {
          const match = trimmed.match(/(\w+):\s*\[\]/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': {}')) {
          const match = trimmed.match(/(\w+):\s*\{\}/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes(': null')) {
          const match = trimmed.match(/(\w+):\s*null/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed === '};') {
          comments[index] = 'Close data object'
        } else if (trimmed.includes('const response = await fetch(')) {
          comments[index] = `Send async request to ${endpoint.name} endpoint`
        } else if (trimmed.includes('method: "')) {
          comments[index] = `Set HTTP method to ${endpoint.method}`
        } else if (trimmed === 'headers: {') {
          comments[index] = 'Configure request headers'
        } else if (trimmed.includes('"Authorization":') && trimmed.includes('Bearer')) {
          comments[index] = 'Add bearer token for authentication'
        } else if (trimmed.includes('"Content-Type":') && trimmed.includes('json')) {
          comments[index] = 'Set content type to application/json'
        } else if (trimmed === '},') {
          comments[index] = 'Close headers object'
        } else if (trimmed.includes('body: JSON.stringify(data)')) {
          comments[index] = 'Convert data object to JSON string for body'
        } else if (trimmed === '});') {
          comments[index] = 'Complete fetch configuration'
        } else if (trimmed.includes('if (response.ok)')) {
          comments[index] = 'Check if request succeeded (status 200-299)'
        } else if (trimmed.includes('const result = await response.json()')) {
          comments[index] = 'Parse response body as JSON'
        } else if (trimmed.includes('console.log("Success"')) {
          comments[index] = 'Log successful response data'
        } else if (trimmed.includes('} else {')) {
          comments[index] = 'Handle error responses'
        } else if (trimmed.includes('console.error("Error"')) {
          comments[index] = 'Log error status and response text'
        } else if (trimmed === '}') {
          comments[index] = 'Close conditional block'
        }
        break

      case 'java':
        if (trimmed.startsWith('import java.net.http')) {
          comments[index] = 'Import HTTP client library'
        } else if (trimmed.startsWith('import java.net.URI')) {
          comments[index] = 'Import URI handling class'
        } else if (trimmed.startsWith('import com.google.gson')) {
          comments[index] = 'Import Gson for JSON serialization'
        } else if (trimmed.startsWith('import java.util.HashMap')) {
          comments[index] = 'Import HashMap for data storage'
        } else if (trimmed.includes('public class APIExample')) {
          comments[index] = 'Define main API example class'
        } else if (trimmed.includes('public static void main(')) {
          comments[index] = 'Main method entry point'
        } else if (trimmed.includes('HttpClient client = ')) {
          comments[index] = 'Create HTTP client instance'
        } else if (trimmed.includes('String token = ')) {
          comments[index] = 'Store JWT authentication token'
        } else if (trimmed.includes('HashMap<String, Object> data = ')) {
          comments[index] = `Initialize data map for ${endpoint.name.toLowerCase()}`
        } else if (trimmed.includes('data.put(')) {
          const match = trimmed.match(/data\.put\("(\w+)",/)
          if (match) {
            comments[index] = getParamDesc(match[1])
          }
        } else if (trimmed.includes('String json = new Gson()')) {
          comments[index] = 'Serialize HashMap to JSON string'
        } else if (trimmed.includes('HttpRequest.Builder builder = ')) {
          comments[index] = 'Initialize HTTP request builder'
        } else if (trimmed.includes('.uri(URI.create(')) {
          comments[index] = 'Set target endpoint URL'
        } else if (trimmed.includes('.header("Authorization"')) {
          comments[index] = 'Add authorization header with bearer token'
        } else if (trimmed.includes('.header("Content-Type"')) {
          comments[index] = 'Set content type to application/json'
        } else if (trimmed.includes(`.${endpoint.method}(HttpRequest.BodyPublishers`)) {
          comments[index] = `Set request method to ${endpoint.method} with body`
        } else if (trimmed.includes('HttpResponse<String> response = ')) {
          comments[index] = 'Execute request and capture response'
        } else if (trimmed.includes('builder.build()')) {
          comments[index] = 'Build the HTTP request'
        } else if (trimmed.includes('HttpResponse.BodyHandlers.ofString()')) {
          comments[index] = 'Handle response as string'
        } else if (trimmed.includes(');')) {
          comments[index] = 'Close method call'
        } else if (trimmed.includes('System.out.println("Status"')) {
          comments[index] = 'Print HTTP status code'
        } else if (trimmed.includes('System.out.println("Response"')) {
          comments[index] = 'Print response body content'
        } else if (trimmed === '}') {
          comments[index] = 'Close block'
        }
        break

      case 'cpp':
        if (trimmed.startsWith('#include <iostream>')) {
          comments[index] = 'Include standard I/O library'
        } else if (trimmed.startsWith('#include <curl/curl.h>')) {
          comments[index] = 'Include libcurl for HTTP requests'
        } else if (trimmed.startsWith('#include <string>')) {
          comments[index] = 'Include string handling library'
        } else if (trimmed.includes('size_t WriteCallback(')) {
          comments[index] = 'Define callback function for response data'
        } else if (trimmed.includes('size_t totalSize = ')) {
          comments[index] = 'Calculate total size of received data'
        } else if (trimmed.includes('output->append(')) {
          comments[index] = 'Append received data to output string'
        } else if (trimmed.includes('return totalSize;')) {
          comments[index] = 'Return number of bytes processed'
        } else if (trimmed === '}') {
          comments[index] = 'Close function/block'
        } else if (trimmed.includes('int main()')) {
          comments[index] = 'Main program entry point'
        } else if (trimmed.includes('CURL* curl = curl_easy_init()')) {
          comments[index] = 'Initialize libcurl session'
        } else if (trimmed.includes('std::string response;')) {
          comments[index] = 'Declare string to store response'
        } else if (trimmed.includes('if (curl)')) {
          comments[index] = 'Check if curl initialized successfully'
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_URL,')) {
          comments[index] = `Set target URL for ${endpoint.name}`
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,')) {
          comments[index] = 'Set callback function for response'
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_WRITEDATA,')) {
          comments[index] = 'Pass response string to callback'
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST,')) {
          comments[index] = `Set HTTP method to ${endpoint.method}`
        } else if (trimmed.includes('struct curl_slist* headers = NULL;')) {
          comments[index] = 'Initialize headers linked list'
        } else if (trimmed.includes('headers = curl_slist_append(headers, "Authorization:')) {
          comments[index] = 'Add authorization header with bearer token'
        } else if (trimmed.includes('headers = curl_slist_append(headers, "Content-Type:')) {
          comments[index] = 'Add content-type header for JSON'
        } else if (trimmed.includes('std::string jsonData = ')) {
          comments[index] = 'Define JSON payload string'
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_POSTFIELDS,')) {
          comments[index] = 'Set request body data'
        } else if (trimmed.includes('curl_easy_setopt(curl, CURLOPT_HTTPHEADER,')) {
          comments[index] = 'Apply headers to request'
        } else if (trimmed.includes('CURLcode res = curl_easy_perform(curl)')) {
          comments[index] = 'Execute HTTP request'
        } else if (trimmed.includes('if (res != CURLE_OK)')) {
          comments[index] = 'Check if request failed'
        } else if (trimmed.includes('std::cerr <<')) {
          comments[index] = 'Print error message to stderr'
        } else if (trimmed.includes('} else {')) {
          comments[index] = 'Handle successful request'
        } else if (trimmed.includes('std::cout <<')) {
          comments[index] = 'Print response data to stdout'
        } else if (trimmed.includes('curl_slist_free_all(headers)')) {
          comments[index] = 'Free headers memory'
        } else if (trimmed.includes('curl_easy_cleanup(curl)')) {
          comments[index] = 'Cleanup curl session'
        } else if (trimmed.includes('return 0;')) {
          comments[index] = 'Return success exit code'
        }
        break
    }
  })

  return comments
}

// API Documentation - Easily updateable structure
const API_DOCUMENTATION = {
  auth: {
    category: 'Authentication',
    icon: 'fa-lock',
    color: 'from-[#5865F2] to-[#4752C4]',
    description: 'User authentication, registration, and OAuth integration',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        name: 'Register User',
        description: 'Create a new user account with email and password',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password (min 8 chars)' },
          { name: 'displayName', type: 'string', required: true, description: 'Display name for user profile' },
        ],
        response: {
          user: '{ id, email, displayName, createdAt, totalRatingsCount, totalGroupsJoined }',
          token: 'JWT token for authentication',
        },
        example: `curl -X POST http://localhost:3001/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"SecurePass123!","displayName":"John Doe"}'`,
        statusCodes: [
          { code: 201, message: 'User created successfully' },
          { code: 400, message: 'Missing required fields or validation failed' },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        name: 'Login User',
        description: 'Authenticate user with email and password',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' },
        ],
        response: {
          user: '{ id, email, displayName, personalityType, adjustmentFactor, totalRatingsCount, totalGroupsJoined }',
          token: 'JWT token for authenticated requests',
        },
        example: `curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"SecurePass123!"}'`,
        statusCodes: [
          { code: 200, message: 'Login successful' },
          { code: 401, message: 'Invalid credentials' },
        ],
      },
      {
        method: 'GET',
        path: '/api/auth/verify',
        name: 'Verify Token',
        description: 'Verify JWT token and get current user information',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          user: '{ id, email, displayName, personalityType, adjustmentFactor, ... }',
        },
        example: `curl -X GET http://localhost:3001/api/auth/verify \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Token is valid' },
          { code: 401, message: 'Invalid or missing token' },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/google',
        name: 'Google OAuth',
        description: 'Authenticate or register using Google',
        parameters: [
          { name: 'token', type: 'string', required: true, description: 'Firebase ID token from Google Sign-In' },
        ],
        response: {
          user: '{ id, email, displayName, avatar, ... }',
          token: 'JWT token for session',
        },
        example: `curl -X POST http://localhost:3001/api/auth/google \\
  -H "Content-Type: application/json" \\
  -d '{"token":"<firebase_id_token>"}'`,
        statusCodes: [
          { code: 200, message: 'Google auth successful' },
          { code: 400, message: 'Invalid token' },
        ],
      },
    ],
  },
  quiz: {
    category: 'Personality Quiz',
    icon: 'fa-brain',
    color: 'from-orange-500 to-orange-600',
    description: 'Personality assessment and profile management',
    endpoints: [
      {
        method: 'GET',
        path: '/api/quiz/questions',
        name: 'Get Quiz Questions',
        description: 'Retrieve all personality quiz questions',
        parameters: [],
        response: {
          questions: '[ { id, text, weight, reverse } ]',
        },
        example: `curl -X GET http://localhost:3001/api/quiz/questions \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Questions retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
      },
      {
        method: 'POST',
        path: '/api/quiz/submit',
        name: 'Submit Quiz',
        description: 'Submit quiz responses and calculate personality profile',
        parameters: [
          { name: 'responses', type: 'number[]', required: true, description: 'Array of responses (1-5 scale)' },
        ],
        response: {
          adjustmentFactor: '-1 to 1 scale (introvert to extrovert)',
          personalityType: 'Strong Introvert, Moderate Introvert, Ambivert, Moderate Extrovert, Strong Extrovert',
          description: 'Description of personality type',
          user: 'Updated user profile with personality data',
          verificationCode: 'Discord verification code (if Discord linked)',
        },
        example: `curl -X POST http://localhost:3001/api/quiz/submit \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"responses":[5,3,4,4,5,3,4,2,4,3]}'`,
        statusCodes: [
          { code: 200, message: 'Quiz submitted successfully' },
          { code: 400, message: 'Invalid responses format' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
      },
      {
        method: 'GET',
        path: '/api/quiz/result',
        name: 'Get Quiz Result',
        description: 'Retrieve stored quiz result for current user',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          quiz: '{ adjustmentFactor, personalityType, description, timestamp }',
        },
        example: `curl -X GET http://localhost:3001/api/quiz/result \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Quiz result found' },
          { code: 404, message: 'No quiz result found' },
        ],
      },
    ],
  },
  ratings: {
    category: 'Place Ratings',
    icon: 'fa-star',
    color: 'from-yellow-400 to-yellow-600',
    description: 'Rate places and view aggregated ratings',
    endpoints: [
      {
        method: 'POST',
        path: '/api/ratings',
        name: 'Create Rating',
        description: 'Submit a rating for a place',
        parameters: [
          { name: 'placeId', type: 'string', required: true, description: 'Unique place identifier' },
          { name: 'placeName', type: 'string', required: true, description: 'Name of the place' },
          { name: 'placeAddress', type: 'string', required: false, description: 'Address of the place' },
          { name: 'location', type: 'object', required: true, description: '{ lat: number, lng: number }' },
          { name: 'categories', type: 'object', required: true, description: '{ atmosphere, service, crowdSize, noiseLevel, socialEnergy } (1-10 scale)' },
          { name: 'comment', type: 'string', required: false, description: 'Optional user comment' },
          { name: 'userAdjustmentFactor', type: 'number', required: false, description: 'User personality type adjustment factor' },
          { name: 'userPersonalityType', type: 'string', required: false, description: 'User personality type' },
        ],
        response: {
          id: 'Rating ID',
          overallScore: 'Calculated weighted overall score (1-10)',
          createdAt: 'Timestamp of rating creation',
        },
        example: `curl -X POST http://localhost:3001/api/ratings \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "placeId": "cafe_123",
    "placeName": "Brew & Co",
    "placeAddress": "123 Main St",
    "location": { "lat": 47.6062, "lng": -122.3321 },
    "categories": {
      "atmosphere": 8,
      "service": 7,
      "crowdSize": 6,
      "noiseLevel": 5,
      "socialEnergy": 7
    },
    "comment": "Great coffee and ambiance!"
  }'`,
        statusCodes: [
          { code: 201, message: 'Rating created successfully' },
          { code: 400, message: 'Validation failed' },
          { code: 500, message: 'Server error' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
      },
      {
        method: 'GET',
        path: '/api/ratings',
        name: 'Get User Ratings',
        description: 'Retrieve all ratings submitted by current user (paginated)',
        parameters: [
          { name: 'limit', type: 'number', required: false, description: 'Results per page (default: 50, max: 100)' },
          { name: 'offset', type: 'number', required: false, description: 'Pagination offset (default: 0)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { id, placeId, placeName, overallScore, categories, comment, createdAt } ]',
          pagination: '{ limit, offset, count }',
        },
        example: `curl -X GET "http://localhost:3001/api/ratings?limit=10&offset=0" \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Ratings retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
      },
      {
        method: 'GET',
        path: '/api/ratings/place/:placeId',
        name: 'Get Place Ratings',
        description: 'Get all ratings for a specific place with aggregated statistics',
        parameters: [
          { name: 'placeId', type: 'string (path)', required: true, description: 'Place identifier' },
        ],
        response: {
          ratings: '[ { id, userId, overallScore, categories, comment, createdAt } ]',
          stats: '{ totalRatings, avgOverallScore, byPersonality, avgCategories, lastRatedAt }',
        },
        example: `curl -X GET http://localhost:3001/api/ratings/place/cafe_123`,
        statusCodes: [
          { code: 200, message: 'Place ratings retrieved' },
          { code: 404, message: 'Place not found' },
        ],
      },
      {
        method: 'PUT',
        path: '/api/ratings/:ratingId',
        name: 'Update Rating',
        description: 'Update an existing rating (only by original author)',
        parameters: [
          { name: 'ratingId', type: 'string (path)', required: true, description: 'Rating ID to update' },
          { name: 'categories', type: 'object', required: false, description: 'Updated category ratings' },
          { name: 'comment', type: 'string', required: false, description: 'Updated comment' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Rating updated',
        },
        example: `curl -X PUT http://localhost:3001/api/ratings/rating_123 \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"categories":{"atmosphere":9},"comment":"Even better now!"}'`,
        statusCodes: [
          { code: 200, message: 'Rating updated' },
          { code: 403, message: 'Unauthorized to update this rating' },
          { code: 404, message: 'Rating not found' },
        ],
      },
      {
        method: 'DELETE',
        path: '/api/ratings/:ratingId',
        name: 'Delete Rating',
        description: 'Delete a rating (only by original author)',
        parameters: [
          { name: 'ratingId', type: 'string (path)', required: true, description: 'Rating ID to delete' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Rating deleted',
        },
        example: `curl -X DELETE http://localhost:3001/api/ratings/rating_123 \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Rating deleted' },
          { code: 403, message: 'Unauthorized' },
          { code: 404, message: 'Rating not found' },
        ],
      },
    ],
  },
  places: {
    category: 'Places & Search',
    icon: 'fa-map-marker-alt',
    color: 'from-emerald-500 to-emerald-600',
    description: 'Search places and get location information',
    endpoints: [
      {
        method: 'GET',
        path: '/api/places/search',
        name: 'Search Places',
        description: 'Search for places by name and location (uses Algolia or OpenStreetMap)',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query (place name or type)' },
          { name: 'location', type: 'string', required: false, description: 'Coordinates in format "lat,lng"' },
          { name: 'radius', type: 'number', required: false, description: 'Search radius in meters (default: 15000)' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category' },
        ],
        response: {
          data: '[ { id, name, address, location, category, stats } ]',
          source: '"algolia" or "openstreetmap"',
          count: 'Number of results',
        },
        example: `curl -X GET "http://localhost:3001/api/places/search?query=cafe&location=47.6062,-122.3321&radius=5000"`,
        statusCodes: [
          { code: 200, message: 'Places found' },
          { code: 400, message: 'Missing search query' },
          { code: 500, message: 'Search service unavailable' },
        ],
      },
      {
        method: 'GET',
        path: '/api/places/reverse',
        name: 'Reverse Geocode',
        description: 'Convert coordinates to address information',
        parameters: [
          { name: 'lat', type: 'number', required: true, description: 'Latitude' },
          { name: 'lng', type: 'number', required: true, description: 'Longitude' },
        ],
        response: {
          data: '{ id, name, address, location }',
        },
        example: `curl -X GET "http://localhost:3001/api/places/reverse?lat=47.6062&lng=-122.3321"`,
        statusCodes: [
          { code: 200, message: 'Address found' },
          { code: 400, message: 'Invalid coordinates' },
        ],
      },
      {
        method: 'GET',
        path: '/api/places/:placeId',
        name: 'Get Place Details',
        description: 'Get detailed information about a specific place',
        parameters: [
          { name: 'placeId', type: 'string (path)', required: true, description: 'Place identifier' },
        ],
        response: {
          data: '{ id, name, address, location, stats }',
        },
        example: `curl -X GET http://localhost:3001/api/places/cafe_123`,
        statusCodes: [
          { code: 200, message: 'Place details retrieved' },
          { code: 404, message: 'Place not found' },
        ],
      },
    ],
  },
  groups: {
    category: 'Groups',
    icon: 'fa-users',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Create and manage group decisions',
    endpoints: [
      {
        method: 'POST',
        path: '/api/groups',
        name: 'Create Group',
        description: 'Create a new group for collaborative place selection',
        parameters: [
          { name: 'memberIds', type: 'string[]', required: true, description: 'Array of user IDs to include' },
          { name: 'searchLocation', type: 'object', required: true, description: '{ lat: number, lng: number }' },
          { name: 'city', type: 'string', required: true, description: 'City name for the group' },
          { name: 'searchRadius', type: 'number', required: false, description: 'Search radius in km (default: 15)' },
          { name: 'communityId', type: 'string', required: false, description: 'Associated community ID' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '{ id, createdBy, members, memberProfiles, searchLocation, city, status }',
        },
        example: `curl -X POST http://localhost:3001/api/groups \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "memberIds": ["user1", "user2", "user3"],
    "searchLocation": { "lat": 47.6062, "lng": -122.3321 },
    "city": "Seattle",
    "searchRadius": 15
  }'`,
        statusCodes: [
          { code: 201, message: 'Group created' },
          { code: 400, message: 'Invalid members or location' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/:groupId',
        name: 'Get Group Details',
        description: 'Retrieve detailed information about a group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
        ],
        response: {
          data: '{ id, members, memberProfiles, recommendedPlaces, votes, status }',
        },
        example: `curl -X GET http://localhost:3001/api/groups/group_123`,
        statusCodes: [
          { code: 200, message: 'Group found' },
          { code: 404, message: 'Group not found' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/user/active',
        name: 'Get User Groups',
        description: 'Get all active groups for current user',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { id, members, city, status } ]',
          count: 'Number of active groups',
        },
        example: `curl -X GET http://localhost:3001/api/groups/user/active \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Groups retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
      },
      {
        method: 'POST',
        path: '/api/groups/:groupId/recommend',
        name: 'Generate Recommendations',
        description: 'Generate personalized place recommendations for group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
          { name: 'searchRadius', type: 'number', required: false, description: 'Override search radius' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { placeId, placeName, predictedScore, confidenceScore, reasoning } ]',
          count: 'Number of recommendations',
        },
        example: `curl -X POST http://localhost:3001/api/groups/group_123/recommend \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"searchRadius": 20}'`,
        statusCodes: [
          { code: 200, message: 'Recommendations generated' },
          { code: 400, message: 'Failed to generate recommendations' },
        ],
      },
      {
        method: 'POST',
        path: '/api/groups/:groupId/vote',
        name: 'Cast Votes',
        description: 'Submit ranked choice votes for places',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
          { name: 'rankedPlaceIds', type: 'string[]', required: true, description: 'Array of place IDs in rank order (1-3)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Votes recorded',
        },
        example: `curl -X POST http://localhost:3001/api/groups/group_123/vote \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"rankedPlaceIds": ["place_1", "place_2", "place_3"]}'`,
        statusCodes: [
          { code: 200, message: 'Votes submitted' },
          { code: 400, message: 'Invalid votes format' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/:groupId/votes',
        name: 'Get Voting Results',
        description: 'Get ranked choice voting results for group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
        ],
        response: {
          data: '{ placeId: { score, votes } }',
        },
        example: `curl -X GET http://localhost:3001/api/groups/group_123/votes`,
        statusCodes: [
          { code: 200, message: 'Results retrieved' },
          { code: 404, message: 'Group not found' },
        ],
      },
    ],
  },
  users: {
    category: 'Users & Matching',
    icon: 'fa-heart',
    color: 'from-pink-500 to-rose-500',
    description: 'Find similar users and manage user profiles',
    endpoints: [
      {
        method: 'GET',
        path: '/api/users/matches',
        name: 'Find Similar Users',
        description: 'Find users with similar personality types and location',
        parameters: [
          { name: 'personalityRange', type: 'number', required: false, description: 'Personality similarity range 0-1 (default: 0.3)' },
          { name: 'maxDistance', type: 'number', required: false, description: 'Max distance in km (default: 50)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { userId, displayName, personalityType, adjustmentFactor, similarity, distance } ]',
          count: 'Number of matches',
        },
        example: `curl -X GET "http://localhost:3001/api/users/matches?personalityRange=0.3&maxDistance=50" \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Matches found' },
          { code: 400, message: 'Invalid parameters' },
        ],
      },
      {
        method: 'GET',
        path: '/api/users/:userId/profile',
        name: 'Get User Profile',
        description: 'Get public user profile information',
        parameters: [
          { name: 'userId', type: 'string (path)', required: true, description: 'User ID' },
        ],
        response: {
          data: '{ id, displayName, avatar, personalityType, adjustmentFactor, totalRatingsCount, totalGroupsJoined }',
        },
        example: `curl -X GET http://localhost:3001/api/users/user_123`,
        statusCodes: [
          { code: 200, message: 'Profile found' },
          { code: 404, message: 'User not found' },
        ],
      },
      {
        method: 'GET',
        path: '/api/users/similarity/:userId1/:userId2',
        name: 'Calculate Similarity',
        description: 'Calculate similarity between two users',
        parameters: [
          { name: 'userId1', type: 'string (path)', required: true, description: 'First user ID' },
          { name: 'userId2', type: 'string (path)', required: true, description: 'Second user ID' },
        ],
        response: {
          similarity: 'Score from 0-1',
          similarityPercent: 'Percentage (0-100)',
        },
        example: `curl -X GET http://localhost:3001/api/users/similarity/user_1/user_2`,
        statusCodes: [
          { code: 200, message: 'Similarity calculated' },
          { code: 404, message: 'User not found' },
        ],
      },
    ],
  },
}

const CodeBlock: React.FC<{ endpoint: any; endpointIndex: number }> = ({ endpoint, endpointIndex }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('curl')
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)
  const languageButtonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const code = generateCodeExample(endpoint, selectedLanguage)
  const codeLines = code.split('\n')
  const comments = getCodeComments(endpoint, selectedLanguage)

  useEffect(() => {
    if (codeRef.current) {
      gsap.fromTo(codeRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      )
    }
  }, [selectedLanguage])

  const handleLanguageChange = (lang: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLanguage(lang)

    languageButtonsRef.current.forEach((btn, i) => {
      if (btn) {
        if (i === index) {
          gsap.to(btn, { scale: 1.05, duration: 0.2, ease: 'back.out(2)' })
          gsap.to(btn, { scale: 1, duration: 0.2, delay: 0.2 })
        }
      }
    })
  }

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopiedCode(true)

    gsap.to(`#copy-icon-${endpointIndex}`, {
      scale: 1.2,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    })

    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="flex items-center gap-2 bg-gradient-to-tr from-blue-300 to-purple-400 rounded-t-xl px-4 py-3 border-b border-indigo-200/40 shadow-md">
        <div className="flex items-center gap-2 flex-1">
          {Object.entries(LANGUAGES).map(([key, lang], index) => (
            <button
              key={key}
              ref={(el) => { languageButtonsRef.current[index] = el }}
              onClick={(e) => handleLanguageChange(key, index, e)}
              onMouseEnter={(e) => {
                if (selectedLanguage !== key) {
                  gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLanguage !== key) {
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 ${selectedLanguage === key
                ? 'bg-gradient-to-br from-white via-purple-50 to-purple-200 text-purple-900 shadow-sm border border-purple-200'
                : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800 shadow-md'
                }`}

            >
              <i
                className={`${key === 'curl' || key === 'cpp' ? 'fa-solid' : 'fab'} ${lang.icon}`}
                style={{ color: selectedLanguage === key ? lang.color : '#fff' }}
              />
              <span>{lang.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={copyToClipboard}
          onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
          onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-300 font-semibold text-sm"
        >
          <i id={`copy-icon-${endpointIndex}`} className={`fas ${copiedCode ? 'fa-check' : 'fa-copy'}`} />
          <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Display */}
      <div
        className="relative bg-gradient-to-br from-white via-purple-50 to-indigo-50 rounded-b-xl overflow-hidden border border-indigo-100 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.3)_2px,rgba(255,255,255,0.3)_4px)]" />
        </div>

        <pre ref={codeRef} className="relative p-6 overflow-x-auto text-sm font-mono leading-relaxed">
          {codeLines.map((line: string, index: number) => {
            const trimmedLine = line.trim()
            let lineColorClass = 'text-indigo-900'

            // VS Code light theme syntax highlighting
            if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || trimmedLine.startsWith('/*')) {
              lineColorClass = 'text-green-700 italic'
            } else if (trimmedLine.includes('import ') || trimmedLine.includes('from ') || trimmedLine.includes('#include')) {
              lineColorClass = 'text-purple-700'
            } else if (trimmedLine.includes('const ') || trimmedLine.includes('let ') || trimmedLine.includes('var ')) {
              lineColorClass = 'text-blue-700'
            } else if (trimmedLine.includes('function') || trimmedLine.includes('def ') || trimmedLine.includes('public ') || trimmedLine.includes('class ') || trimmedLine.includes('async ') || trimmedLine.includes('await ')) {
              lineColorClass = 'text-purple-700'
            } else if (trimmedLine.includes('if ') || trimmedLine.includes('else') || trimmedLine.includes('return ') || trimmedLine.includes('for ') || trimmedLine.includes('while ')) {
              lineColorClass = 'text-pink-700'
            } else if (line.match(/["'`]/)) {
              lineColorClass = 'text-orange-700'
            } else if (trimmedLine.match(/^\d+$/) || line.match(/\b\d+\b/)) {
              lineColorClass = 'text-green-700'
            }

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredLine(index)}
                onMouseLeave={() => setHoveredLine(null)}
                onClick={(e) => e.stopPropagation()}
                className="relative group hover:bg-white/40 transition-colors duration-200 -mx-6 px-6 py-0.5 cursor-text"
              >
                <div className="flex items-start gap-4">
                  <span className="text-indigo-400 select-none w-8 text-right flex-shrink-0 group-hover:text-indigo-600 transition-colors duration-200 font-semibold">
                    {index + 1}
                  </span>
                  <code className={`flex-1 ${lineColorClass}`}>
                    {line.split(/(\s+|[{}()\[\];,.<>!=+\-*/%&|^~]|"[^"]*"|'[^']*'|`[^`]*`)/).map((token, i) => {
                      if (!token) return null

                      // Keyword highlighting
                      if (['import', 'from', 'const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'class', 'public', 'private', 'static', 'void', 'int', 'String', 'def', 'try', 'catch', 'throw', 'new'].includes(token)) {
                        return <span key={i} className="text-purple-700 font-semibold">{token}</span>
                      }

                      // String highlighting
                      if (token.match(/^["'`].*["'`]$/)) {
                        return <span key={i} className="text-orange-700">{token}</span>
                      }

                      // Number highlighting
                      if (token.match(/^\d+$/)) {
                        return <span key={i} className="text-green-700">{token}</span>
                      }

                      // Function calls
                      if (token.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) && codeLines[index].includes(`${token}(`)) {
                        return <span key={i} className="text-blue-800 font-semibold">{token}</span>
                      }

                      // Operators
                      if (token.match(/[=+\-*/%<>!&|]/)) {
                        return <span key={i} className="text-pink-700">{token}</span>
                      }

                      return <span key={i} className="text-indigo-900">{token}</span>
                    })}
                  </code>
                </div>

                {/* Inline Comment on Hover */}
                {hoveredLine === index && comments[index] && (
                  <div
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/95 text-green-700 px-3 py-1.5 rounded-lg text-xs font-mono border border-indigo-300 shadow-xl backdrop-blur-sm whitespace-nowrap pointer-events-none z-10"
                    style={{
                      animation: 'slideInRight 0.3s ease-out'
                    }}
                  >
                    {comments[index]}
                  </div>
                )}
              </div>
            )
          })}
        </pre>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(10px) translateY(-50%);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(-50%);
          }
        }
      `}</style>
    </div>
  )
}

export const APIDocumentation: React.FC = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const categoryHeaderRef = useRef<HTMLDivElement>(null)
  const endpointRefs = useRef<(HTMLDivElement | null)[]>([])

  const [activeCategory, setActiveCategory] = useState('auth')
  const [activeEndpoint, setActiveEndpoint] = useState(-1)

  // Initial page load animation
  useEffect(() => {
    if (!containerRef.current || !sidebarRef.current || !contentRef.current || !headerRef.current) return

    const tl = gsap.timeline()

    tl.fromTo(headerRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )

    tl.fromTo(sidebarRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' },
      0.2
    )

    tl.fromTo(contentRef.current,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' },
      0.3
    )
  }, [])

  // Category change animation
  useEffect(() => {
    if (!categoryHeaderRef.current) return

    gsap.fromTo(categoryHeaderRef.current,
      { scale: 0.95, opacity: 0, rotateX: -15 },
      { scale: 1, opacity: 1, rotateX: 0, duration: 0.6, ease: 'back.out(1.4)' }
    )

    endpointRefs.current.forEach((ref, idx) => {
      if (ref) {
        gsap.fromTo(ref,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: idx * 0.1, ease: 'power2.out' }
        )
      }
    })
  }, [activeCategory])

  // Endpoint expansion animation
  useEffect(() => {
    const expandedContent = document.querySelector(`#endpoint-content-${activeEndpoint}`)
    if (expandedContent) {
      gsap.fromTo(expandedContent,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [activeEndpoint])

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId)
    setActiveEndpoint(-1)
  }

  const handleEndpointClick = (idx: number) => {
    const wasActive = activeEndpoint === idx
    setActiveEndpoint(wasActive ? -1 : idx)

    const element = endpointRefs.current[idx]
    if (element && !wasActive) {
      gsap.to(element, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(element, { scale: 1, duration: 0.2, ease: 'power2.out' })
          const elementTop = element.getBoundingClientRect().top + window.scrollY - 100
          window.scrollTo({ top: elementTop, behavior: 'smooth' })
        }
      })
    }
  }

  const handleCategoryHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    const icon = e.currentTarget.querySelector('.category-icon')
    if (icon) {
      gsap.to(icon, {
        rotate: isEnter ? 360 : 0,
        scale: isEnter ? 1.1 : 1,
        duration: 0.5,
        ease: 'back.out(2)'
      })
    }
  }

  const categories = Object.entries(API_DOCUMENTATION).map(([key, value]) => ({ id: key, ...value }))
  const currentCategory = API_DOCUMENTATION[activeCategory as keyof typeof API_DOCUMENTATION]

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
      <Snowfall
        color={
          activeCategory === 'auth' ? '#5865F2' :
            activeCategory === 'quiz' ? '#F97316' :
              activeCategory === 'ratings' ? '#FCD34D' :
                activeCategory === 'places' ? '#34D399' :
                  activeCategory === 'groups' ? '#06B6D4' :
                    activeCategory === 'users' ? '#EC4899' :
                      '#337cea'
        }
        snowflakeCount={15}
        style={{ position: 'fixed', width: '100vw', height: '100vh', opacity: 0.5 }}
      />
      {/* Header */}
      <header ref={headerRef} className="w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <i className="fas fa-code text-white text-lg" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documentation</p>
              <h1 className="text-lg font-bold text-slate-900">Senergy API</h1>
            </div>
          </div>
          <DashboardReturnBtn />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside ref={sidebarRef} className="w-72 flex-shrink-0 sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">API Reference</h2>
            <nav className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  onMouseEnter={(e) => handleCategoryHover(e, true)}
                  onMouseLeave={(e) => handleCategoryHover(e, false)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 group ${activeCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                    : 'text-slate-700 hover:bg-slate-50 hover:scale-102 hover:shadow-md'
                    }`}
                >
                  <div className={`category-icon w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${activeCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <i className={`fas ${cat.icon} ${activeCategory === cat.id ? 'text-white' : `text-slate-600`}`} />
                  </div>
                  <span className="flex-1 text-left">{cat.category}</span>
                  {activeCategory === cat.id && (
                    <i className="fas fa-chevron-right text-white/80 animate-pulse" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {currentCategory && (
            <>
              {/* Category Header */}
              <div
                ref={categoryHeaderRef}
                className={`bg-gradient-to-br ${currentCategory.color} rounded-2xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden hover:shadow-3xl transition-shadow duration-300`}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-6 transition-all duration-300">
                    <i className={`fas ${currentCategory.icon} text-3xl`} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black">{currentCategory.category}</h1>
                    <p className="text-white/80 mt-1">{currentCategory.description}</p>
                  </div>
                </div>
              </div>

              {/* Endpoints */}
              <div className="space-y-6">
                {currentCategory.endpoints.map((endpoint, idx) => (
                  <div
                    key={idx}
                    ref={(el) => { endpointRefs.current[idx] = el }}
                    className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl ${activeEndpoint === idx ? 'border-indigo-400 shadow-indigo-100' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    onClick={() => handleEndpointClick(idx)}
                  >
                    {/* Endpoint Header */}
                    <div className="p-6 border-b border-slate-200 hover:bg-slate-50/50 transition-colors duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${endpoint.method === 'GET' ? 'bg-blue-500' :
                            endpoint.method === 'POST' ? 'bg-green-500' :
                              endpoint.method === 'PUT' ? 'bg-yellow-500' :
                                'bg-red-500'
                            }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors duration-300">{endpoint.path}</code>
                        </div>
                        <i className={`fas fa-chevron-down transition-all duration-500 text-slate-400 ${activeEndpoint === idx ? 'rotate-180 text-indigo-500' : ''}`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{endpoint.name}</h3>
                      <p className="text-slate-600 text-sm mt-2">{endpoint.description}</p>
                    </div>

                    {/* Expanded Content */}
                    {activeEndpoint === idx && (
                      <div id={`endpoint-content-${idx}`} className="bg-gradient-to-b from-slate-50 to-white p-6 space-y-6 border-t border-slate-200">
                        {/* Parameters */}
                        {endpoint.parameters.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <i className="fas fa-sliders-h text-indigo-500" />
                              Parameters
                            </h4>
                            <div className="space-y-2">
                              {endpoint.parameters.map((param: any, pidx: number) => (
                                <div
                                  key={pidx}
                                  className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all duration-300 hover:scale-102"
                                  style={{ animationDelay: `${pidx * 50}ms` }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-mono text-indigo-600 font-semibold">{param.name}</code>
                                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">{param.type}</span>
                                    {param.required && (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold animate-pulse">Required</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600">{param.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <i className="fas fa-reply text-green-500" />
                            Response
                          </h4>
                          <div className="p-4 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-700 space-y-1 hover:border-green-200 hover:shadow-md transition-all duration-300">
                            {Object.entries(endpoint.response).map(([key, val]) => (
                              <div key={key} className="hover:bg-slate-50 px-2 py-1 rounded transition-colors duration-200">
                                <span className="text-indigo-600 font-semibold">{key}:</span> <span className="text-slate-600">{val as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status Codes */}
                        {endpoint.statusCodes && endpoint.statusCodes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <i className="fas fa-info-circle text-blue-500" />
                              Status Codes
                            </h4>
                            <div className="space-y-2">
                              {endpoint.statusCodes.map((status: any, sidx: number) => (
                                <div
                                  key={sidx}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-300"
                                >
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${status.code >= 200 && status.code < 300 ? 'bg-green-500' :
                                    status.code >= 400 && status.code < 500 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}>
                                    {status.code}
                                  </span>
                                  <span className="text-sm text-slate-700">{status.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Code Examples */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <i className="fas fa-code text-purple-500" />
                            Code Examples
                          </h4>
                          <CodeBlock endpoint={endpoint} endpointIndex={idx} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}