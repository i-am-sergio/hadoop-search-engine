import React from 'react';

// Use React.ImgHTMLAttributes for an <img> element
// We can also extend React.HTMLProps<HTMLImageElement> if you need more generic HTML props.
interface SvgIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string; // Path to the SVG file
  alt?: string; // Alt text for accessibility
  // If you also want to pass specific SVG properties that are not standard img attributes,
  // you might need to handle them separately or ensure they don't cause type conflicts.
  // For most common use cases with SVGs as <img> src, ImgHTMLAttributes is sufficient.
}

const SvgIcon: React.FC<SvgIconProps> = ({ src, alt, className, ...props }) => {
  return (
    <img
      src={src}
      alt={alt || 'icon'}
      className={className} // Tailwind classes will be passed here
      {...props} // This now correctly spreads HTMLImageElement properties
    />
  );
};

export default SvgIcon;