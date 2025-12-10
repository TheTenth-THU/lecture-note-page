import Image from 'next/image';
import clsx from 'clsx';
import { stoneSerif } from '@/app/ui/fonts';

export default function Logo({ width = 48, height = 48, className, text }: { width?: number; height?: number; className?: string; text?: string }) {
  if (text) {
    return (
      <div
        className={clsx(
          'flex flex-row items-center leading-none',
          stoneSerif.className,
          className
        )}
      >
        <Image
          width={width}
          height={height}
          src="/assets/logo.png"
          alt="TheTenth Logo"
          className='h-12 w-12'
          priority
        />
        <p className={`text-[${height}px] font-semibold`}>
          {text}
        </p>
      </div>
    );
  } else {
    return (
      <div
        className={clsx(
          'flex flex-row items-center leading-none',
          className
        )}
      >
        <Image
          width={width}
          height={height}
          src="/assets/logo.png"
          alt="TheTenth Logo"
          className='h-12 w-12'
          priority
        />
      </div>
    );
  }
}
