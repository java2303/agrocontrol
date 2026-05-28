const API_URL = 'http://localhost:4000/api';

export const apiService = {
  /**
   * Recupera todas las parcelas del usuario actual
   * @param token JWT obtenido en el login
   */
  async fetchParcels(token: string) {
    const response = await fetch(`${API_URL}/parcelas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('No se pudieron obtener las parcelas del CIAT');
    }

    return await response.json();
  }
};