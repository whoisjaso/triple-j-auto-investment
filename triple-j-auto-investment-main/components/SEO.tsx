interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  noindex?: boolean;
}

const SITE_URL = 'https://triplejautoinvestment.com';
const OG_IMAGE = `${SITE_URL}/GoldTripleJLogo.png`;

export const SEO = ({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  noindex = false,
}: SEOProps) => {
  const canonical = `${SITE_URL}${path}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OG_IMAGE} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="alternate" hreflang="en" href={canonical} />
      <link rel="alternate" hreflang="es" href={canonical} />
      <link rel="alternate" hreflang="x-default" href={canonical} />
    </>
  );
};
