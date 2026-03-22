/**
 * Keyword-based AI categorization engine for Brazilian financial transactions.
 * Learns from user corrections stored in localStorage.
 */

const CORRECTIONS_KEY = 'ai_category_corrections'

// ─── Keyword maps ──────────────────────────────────────────────────────────────
// Format: [keywords[], categoryName, baseConfidence]

type KeywordRule = [string[], string, number]

const KEYWORD_RULES: KeywordRule[] = [
  // Alimentação
  [
    ['supermercado', 'carrefour', 'pão de açúcar', 'extra supermercado', 'atacadão', 'assaí',
     'mercado', 'hiper', 'walmart', 'ifood', 'rappi', 'uber eats', 'james delivery',
     'restaurante', 'lanchonete', 'pizzaria', 'hamburguer', 'sushi', 'padaria',
     'cafeteria', 'açougue', 'hortifruti', 'feira'],
    'Alimentação',
    90,
  ],
  // Transporte
  [
    ['uber', '99', 'cabify', 'taxi', 'táxi', 'posto', 'combustível', 'gasolina', 'etanol',
     'diesel', 'estacionamento', 'pedágio', 'metrô', 'ônibus', 'bilhete único',
     'passagem', 'transporte', 'moto', 'bicicleta', 'scooter', 'patinete'],
    'Transporte',
    88,
  ],
  // Entretenimento
  [
    ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'apple tv', 'youtube premium',
     'globoplay', 'paramount', 'deezer', 'cinema', 'ingresso', 'teatro',
     'show', 'evento', 'balada', 'bar', 'pub', 'clube', 'parque', 'jogo', 'steam'],
    'Entretenimento',
    92,
  ],
  // Saúde
  [
    ['farmácia', 'drogasil', 'droga raia', 'ultrafarma', 'drogaria', 'panvel',
     'hospital', 'clínica', 'médico', 'dentista', 'psicólogo', 'consulta',
     'plano de saúde', 'unimed', 'hapvida', 'laboratório', 'exame',
     'academia', 'smart fit', 'bodytech', 'crossfit', 'nutricionista'],
    'Saúde',
    85,
  ],
  // Educação
  [
    ['escola', 'colégio', 'universidade', 'faculdade', 'curso', 'udemy', 'coursera',
     'alura', 'rocketseat', 'dio', 'livro', 'livraria', 'amazon livros',
     'material escolar', 'mensalidade escolar', 'período letivo', 'matrícula'],
    'Educação',
    87,
  ],
  // Moradia
  [
    ['aluguel', 'condomínio', 'energia', 'água', 'gás', 'luz', 'enel', 'cemig', 'eletropaulo',
     'sabesp', 'comgás', 'internet', 'claro', 'vivo', 'tim', 'oi', 'net',
     'telefone', 'iptu', 'manutenção', 'reforma', 'conserto', 'encanamento'],
    'Moradia',
    83,
  ],
  // Renda
  [
    ['salário', 'salario', 'freelance', 'pix recebido', 'transferência recebida',
     'ted recebida', 'doc recebido', 'rendimento', 'dividendo', 'bonificação',
     'comissão', 'décimo terceiro', '13 salário', 'férias', 'reembolso',
     'depósito', 'crédito em conta'],
    'Renda',
    95,
  ],
  // Compras
  [
    ['amazon', 'mercado livre', 'shopee', 'americanas', 'magazine luiza', 'casas bahia',
     'submarino', 'aliexpress', 'shein', 'zara', 'renner', 'riachuelo', 'c&a',
     'hm', 'marisa', 'lojas', 'roupas', 'calçados', 'eletrônicos', 'games'],
    'Compras',
    80,
  ],
  // Pets
  [
    ['petshop', 'pet shop', 'petlove', 'petz', 'cobasi', 'ração', 'veterinário',
     'animais', 'cachorro', 'gato', 'banho e tosa'],
    'Pets',
    90,
  ],
  // Beleza
  [
    ['salão', 'barbearia', 'cabeleireiro', 'manicure', 'pedicure', 'estética',
     'spa', 'perfumaria', 'sephora', 'natura', 'boticário', 'avon', 'maquiagem'],
    'Beleza',
    85,
  ],
  // Investimentos
  [
    ['tesouro direto', 'cdb', 'lci', 'lca', 'fundo de investimento', 'ações',
     'bolsa de valores', 'b3', 'corretora', 'xp investimentos', 'nuinvest',
     'inter invest', 'clear', 'warren', 'renda fixa', 'poupança'],
    'Investimentos',
    88,
  ],
]

// ─── Corrections storage ───────────────────────────────────────────────────────

type CorrectionsMap = Record<string, string>

function loadCorrections(): CorrectionsMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CORRECTIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCorrections(corrections: CorrectionsMap) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(corrections))
}

function normalizeKey(description: string): string {
  return description.toLowerCase().trim()
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface CategorySuggestion {
  categoryName: string
  confidence: number // 0–100
}

/**
 * Suggest a category for a transaction description.
 * Checks user corrections first, then falls back to keyword matching.
 */
export function suggestCategory(description: string): CategorySuggestion | null {
  const normalized = normalizeKey(description)
  if (!normalized) return null

  // 1. Check learned corrections (100% confidence)
  const corrections = loadCorrections()
  const correctedKey = Object.keys(corrections).find((k) => normalized.includes(k))
  if (correctedKey) {
    return { categoryName: corrections[correctedKey], confidence: 100 }
  }

  // 2. Keyword matching
  let bestMatch: { categoryName: string; confidence: number; matchCount: number } | null = null

  for (const [keywords, categoryName, baseConfidence] of KEYWORD_RULES) {
    let matchCount = 0
    for (const kw of keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        matchCount++
      }
    }
    if (matchCount > 0) {
      const confidence = Math.min(100, baseConfidence + (matchCount - 1) * 3)
      if (!bestMatch || matchCount > bestMatch.matchCount || confidence > bestMatch.confidence) {
        bestMatch = { categoryName, confidence, matchCount }
      }
    }
  }

  if (bestMatch) {
    return { categoryName: bestMatch.categoryName, confidence: bestMatch.confidence }
  }

  return null
}

/**
 * Store a user correction to improve future suggestions.
 * Uses the normalized description as the key.
 */
export function trainFromCorrection(description: string, correctCategory: string): void {
  const key = normalizeKey(description)
  if (!key) return
  const corrections = loadCorrections()
  corrections[key] = correctCategory
  saveCorrections(corrections)
}

/**
 * Clear all learned corrections.
 */
export function clearCorrections(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CORRECTIONS_KEY)
}

/**
 * Bulk suggest categories for multiple transactions.
 */
export function bulkSuggestCategories(
  descriptions: string[]
): (CategorySuggestion | null)[] {
  return descriptions.map((d) => suggestCategory(d))
}
