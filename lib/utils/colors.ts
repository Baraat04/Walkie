// Generate a consistent color for a player based on their user ID
export const PLAYER_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF',
  '#FF00FF', '#C0C0C0', '#808080', '#800000', '#808000',
  '#008000', '#800080', '#008080', '#000080', '#FFA500',
  '#FF4500', '#DA70D6', '#EEE8AA', '#98FB98', '#AFEEEE',
  '#DB7093', '#FFEFD5', '#FFDAB9', '#CD853F', '#FFC0CB',
  '#DDA0DD', '#B0E0E6', '#DC143C', '#4169E1', '#8B4513',
  '#FA8072', '#F4A460', '#2E8B57', '#FFF5EE', '#A0522D',
  '#D3D3D3', '#87CEEB', '#6A5ACD', '#708090', '#00FF7F',
  '#4682B4', '#D2B48C', '#20B2AA', '#D8BFD8', '#FF6347',
  '#40E0D0', '#EE82EE', '#F5DEB3', '#FFFFFF', '#F5F5F5',
  '#9ACD32', '#66CDAA', '#3CB371', '#5F9EA0', '#00FA9A'
]

export function getPlayerColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length]
}

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(255,107,107,${alpha})`
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`
}
