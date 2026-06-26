import api from './interceptor'

export interface LetterTemplate {
  id: number
  name: string
  content: string
  fields: {
    key: string
    label: string
    placeholder: string
    value?: string
  }[]
  meta: {
    includeHeader: boolean
    includeFooter: boolean
    includeBackground: boolean
  }
  createdAt?: string
  updatedAt?: string
}

class LetterTemplateService {
  async getAllLetterTemplates() {
    try {
      const response = await api.get('/letter-templates')
      return {
        success: true,
        data: response.data.data as LetterTemplate[]
      }
    } catch (error: any) {
      console.error('Error fetching letter templates:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch letter templates'
      }
    }
  }

  async getLetterTemplateById(id: number) {
    try {
      const response = await api.get(`/letter-templates/${id}`)
      return {
        success: true,
        data: response.data.data as LetterTemplate
      }
    } catch (error: any) {
      console.error('Error fetching letter template:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch letter template'
      }
    }
  }

  async createLetterTemplate(data: Omit<LetterTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const response = await api.post('/letter-templates', data)
      return {
        success: true,
        data: response.data.data as LetterTemplate,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error creating letter template:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create letter template'
      }
    }
  }

  async updateLetterTemplate(id: number, data: Partial<LetterTemplate>) {
    try {
      const response = await api.put(`/letter-templates/${id}`, data)
      return {
        success: true,
        data: response.data.data as LetterTemplate,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error updating letter template:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update letter template'
      }
    }
  }

  async deleteLetterTemplate(id: number) {
    try {
      const response = await api.delete(`/letter-templates/${id}`)
      return {
        success: true,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('Error deleting letter template:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete letter template'
      }
    }
  }
}

export default new LetterTemplateService()
