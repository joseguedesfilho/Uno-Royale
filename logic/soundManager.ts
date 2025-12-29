
export const SOUNDS = {
  // Som de jogar carta: Um impacto nítido e satisfatório de carta sendo batida
  CARD_PLAY: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', 
  // Som de compra: Mantido como um estalo seco para evitar o rastro de ar (sussurro)
  CARD_DRAW: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 
  WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', 
  LOSE: 'https://assets.mixkit.co/active_storage/sfx/2513/2513-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
};

export const playSound = (soundUrl: string) => {
  const audio = new Audio(soundUrl);
  // Volume ajustado para 0.5 para dar o peso "Real" às jogadas de carta
  audio.volume = 0.5; 
  audio.play().catch(e => console.log('Áudio impedido pelo navegador'));
};
