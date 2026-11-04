import { SectionPlaceholder } from '../../components/SectionPlaceholder';

// Раздел «Обмен силой» — заглушка до реализации полного сценария
export default function PowerExchangeScreen() {
  return (
    <SectionPlaceholder
      title="Обмен силой"
      icon="sun-o"
      description="Место, где можно поделиться теплом, поддержать другого и вернуть себе силу."
      bullets={[
        'Короткие сообщения поддержки и благодарности',
        'Реакции и отклик сообщества',
        'Бережная модерация и тишина без лишнего шума',
      ]}
    />
  );
}
