export interface Family {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  family_id: string
  role: 'admin' | 'parent' | 'kid'
  kid_id?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Kid {
  id: string
  family_id: string
  name: string
  age?: number
  avatar?: string
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  family_id: string
  kid_id: string
  amount: number
  reason?: string
  transaction_type: 'award' | 'redeem' | 'adjustment'
  created_by?: string
  created_at: string
}

export interface FamilySettings {
  id: string
  family_id: string
  theme: string
  theme_colors: {
    primary: string
    secondary: string
  }
  point_values: {
    small: number
    medium: number
    large: number
  }
  conversion_rate: number
  created_at: string
  updated_at: string
}

export interface KidWithBalance extends Kid {
  balance: number
}

export interface TransactionWithKid extends Transaction {
  kid?: Kid
}
