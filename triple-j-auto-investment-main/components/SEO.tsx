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
}: SEOProps) => (
  <>
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={`${SITE_URL}${path}`} />
    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    <meta property="og:url" content={`${SITE_URL}${path}`} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content={OG_IMAGE} />
    {noindex && <meta name="robots" content="noindex, nofollow" />}
  </>
);
