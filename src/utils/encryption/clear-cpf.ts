export default function clearCpf(cpf: string) {
  return cpf.replace(/\D/g, "");
}
