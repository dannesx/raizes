import React, { useState } from 'react';
import type { Gender } from '../types';
import { predictGender } from '../utils/genderPredictor';
import { isPetMember } from '../utils/petDetector';

interface AvatarSvgProps {
  name: string;
  gender?: Gender;
  relation?: string;
  isPet?: boolean;
  size?: number;
  className?: string;
}

export const AvatarSvg: React.FC<AvatarSvgProps> = ({
  name,
  gender,
  relation = '',
  isPet = false,
  size = 56,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const petFlag = isPet || isPetMember(relation);

  // Previsão inteligente de gênero
  const effectiveGender = predictGender(name, relation, gender);

  // Hash determinístico baseado no nome para variações consistentes
  const hash = (name || 'peep')
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000, 0);

  // Paleta de fundo baseada nos tokens do Material Design 3 (material-theme.json)
  const bgColors = petFlag
    ? ['bcebf0', 'bdf0b4', 'd6e8ce']
    : [
        'bdf0b4', // primaryContainer
        'd6e8ce', // secondaryContainer
        'bcebf0', // tertiaryContainer
        'e0e4db', // surfaceContainerHighest
      ];
  const bg = bgColors[hash % bgColors.length];

  // Cores de roupas baseadas nas cores M3
  const clothingColors = petFlag
    ? ['38656a', '3c6939', '53634f']
    : [
        '3c6939', // primary
        '53634f', // secondary
        '38656a', // tertiary
        '245023', // onPrimaryContainer
        '1e4d52', // onTertiaryContainer
      ];
  const clothing = clothingColors[(hash + 1) % clothingColors.length];

  const isElder = !petFlag && /av[oó]|vov[oó]|bisav[oó]/i.test(relation);

  // Montagem da URL da API DiceBear estilo Open Peeps
  const dicebearUrl = new URL('https://api.dicebear.com/9.x/open-peeps/svg');
  dicebearUrl.searchParams.set('seed', name || 'peep');
  dicebearUrl.searchParams.set('backgroundColor', bg);
  dicebearUrl.searchParams.set('clothingColor', clothing);
  dicebearUrl.searchParams.set('scale', '95');

  if (petFlag) {
    // Para pets: utiliza a cabeça animal 'bear' do Open Peeps com expressão fofa
    dicebearUrl.searchParams.set('head', 'bear');
    dicebearUrl.searchParams.set('facialHairProbability', '0');
    dicebearUrl.searchParams.set('face', ['cute', 'eatingHappy', 'smile', 'lovingGrin1'][hash % 4]);
  } else if (effectiveGender === 'female') {
    const femaleHeads = isElder
      ? ['grayBun', 'bun', 'medium1', 'mediumStraight']
      : [
          'bangs',
          'bangs2',
          'bantuKnots',
          'bun',
          'bun2',
          'buns',
          'long',
          'longAfro',
          'longBangs',
          'longCurly',
          'medium1',
          'medium2',
          'medium3',
          'mediumBangs',
          'mediumBangs2',
          'mediumBangs3',
          'mediumStraight',
          'twists',
          'twists2',
        ];

    const selectedHead = femaleHeads[hash % femaleHeads.length];
    dicebearUrl.searchParams.set('head', selectedHead);
    dicebearUrl.searchParams.set('facialHairProbability', '0');
    dicebearUrl.searchParams.set(
      'face',
      ['smile', 'smileBig', 'smileLOL', 'lovingGrin1', 'lovingGrin2', 'cute', 'calm', 'cheeky'][
        hash % 8
      ]
    );
  } else if (effectiveGender === 'male') {
    const maleHeads = isElder
      ? ['grayShort', 'grayMedium', 'noHair1', 'short1']
      : [
          'short1',
          'short2',
          'short3',
          'short4',
          'short5',
          'flatTop',
          'flatTopLong',
          'afro',
          'cornrows',
          'cornrows2',
          'dreads1',
          'dreads2',
          'pomp',
          'shaved1',
          'shaved2',
          'mohawk',
          'hatBeanie',
          'hatHip',
        ];

    const selectedHead = maleHeads[hash % maleHeads.length];
    dicebearUrl.searchParams.set('head', selectedHead);
    dicebearUrl.searchParams.set('facialHairProbability', isElder ? '70' : '45');
    dicebearUrl.searchParams.set(
      'face',
      ['smile', 'smileBig', 'lovingGrin1', 'driven', 'calm', 'cheeky'][hash % 6]
    );
  } else {
    // Other / Não especificado
    dicebearUrl.searchParams.set('facialHairProbability', '20');
  }

  // Fallback offline caso a conexão com api.dicebear.com falhe
  if (hasError) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: `#${bg}`,
          color: `#${clothing}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size * 0.45,
          userSelect: 'none',
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={dicebearUrl.toString()}
      alt={`Avatar Open Peeps de ${name}`}
      width={size}
      height={size}
      className={className}
      onError={() => setHasError(true)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block',
        backgroundColor: `#${bg}`,
      }}
      loading="lazy"
    />
  );
};
