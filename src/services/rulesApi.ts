import type { RiskRule, ParsedDocument, ContractTemplate } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  error?: string;
}

class RulesApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'RulesApiError';
  }
}

const API_BASE = 'http://localhost:3001';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message || errorData?.error) {
        errorMessage = errorData.message || errorData.error;
      }
    } catch {
      // ignore
    }
    throw new RulesApiError(errorMessage, response.status);
  }

  try {
    const json = await response.json() as ApiResponse<T>;
    if (!json.success) {
      throw new RulesApiError(json.error || 'API request failed');
    }
    return json.data;
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError('Failed to parse response data');
  }
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  if (!file) {
    throw new RulesApiError('请选择要上传的文件');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/documents/parse`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<ParsedDocument>(response);
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError(
      e instanceof Error ? e.message : '文件解析失败'
    );
  }
}

export async function fetchContractTemplate(): Promise<ContractTemplate> {
  try {
    const response = await fetch(`${API_BASE}/api/documents/template`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<ContractTemplate>(response);
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError(
      e instanceof Error ? e.message : '获取合同模板失败'
    );
  }
}

export async function fetchRules(category?: string, level?: string): Promise<RiskRule[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (level) params.append('level', level);

    const url = `${API_BASE}/api/rules${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<RiskRule[]>(response);
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError(
      e instanceof Error ? e.message : 'Failed to fetch rules'
    );
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/api/rules/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<string[]>(response);
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError(
      e instanceof Error ? e.message : 'Failed to fetch categories'
    );
  }
}

export async function fetchRuleById(id: string): Promise<RiskRule> {
  if (!id) {
    throw new RulesApiError('Rule ID is required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/rules/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<RiskRule>(response);
  } catch (e) {
    if (e instanceof RulesApiError) {
      throw e;
    }
    throw new RulesApiError(
      e instanceof Error ? e.message : `Failed to fetch rule with id: ${id}`
    );
  }
}
