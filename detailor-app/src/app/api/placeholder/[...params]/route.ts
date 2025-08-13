import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const resolvedParams = await params;
  
  // Extract width and height from URL params
  const [width = '400', height = '400'] = resolvedParams.params;
  
  const w = parseInt(width, 10) || 400;
  const h = parseInt(height, 10) || 400;
  
  // Create a simple placeholder SVG
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#e5e7eb"/>
      <line x1="0" y1="0" x2="${w}" y2="${h}" stroke="#9ca3af" stroke-width="2"/>
      <line x1="${w}" y1="0" x2="0" y2="${h}" stroke="#9ca3af" stroke-width="2"/>
      <text x="${w/2}" y="${h/2}" text-anchor="middle" dy="0.3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">
        ${w} × ${h}
      </text>
    </svg>
  `.trim();
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    },
  });
}