import { redirect } from 'next/navigation';

export default function FormulasPage() {
  redirect('/search?q=&type=formula');
}
