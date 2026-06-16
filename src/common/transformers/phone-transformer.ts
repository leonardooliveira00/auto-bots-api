import { Transform } from 'class-transformer';
import { maskPhone } from '../../utils/masks/mask.phone';

export const TransformPhone = () =>
  Transform(({ value }) => (value ? maskPhone(value) : ''));
