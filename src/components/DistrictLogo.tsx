import Link from "next/link";
import Image from "next/image";

interface DistrictLogoProps {
  href?: string;
}

export function DistrictLogo({ href = "/hub" }: DistrictLogoProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center overflow-hidden"
      aria-label="Ir para o hub do Distrito Tecnologico"
    >
      <Image
        src="/logo-distrito.png"
        alt="Logo do Distrito Tecnologico"
        width={178}
        height={52}
        priority
        className="h-8 w-auto max-w-[120px] object-contain sm:h-9 sm:max-w-[150px] lg:h-10 lg:max-w-[170px]"
      />
    </Link>
  );
}
