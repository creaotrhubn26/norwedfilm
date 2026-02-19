import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Code2, Download, Copy, Check, FileCode, FileJson, 
  Braces, LayoutTemplate, Palette, Loader2 
} from "lucide-react";
import { tidumPageStyles, TIDUM_TOKENS } from "@/lib/tidum-page-styles";

interface Section {
  id: string;
  type: string;
  title: string;
  content: any;
  spacing: any;
  background: any;
  layout?: any;
  animations?: any;
  order: number;
  children?: Section[];
}

interface CodeExportProps {
  sections: Section[];
}

export function CodeExport({ sections }: CodeExportProps) {
  const { toast } = useToast();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [serverGenerated, setServerGenerated] = useState<Record<string, string>>({});
  const [serverLoading, setServerLoading] = useState<Record<string, boolean>>({});

  const galleryAnimationKeyframes = `
    @keyframes tidum-cinematic-pan {
      0% { transform: scale(var(--tidum-pan-scale-start, 1.02)) translateX(var(--tidum-pan-x-start, -1.5%)); }
      100% { transform: scale(var(--tidum-pan-scale-end, 1.12)) translateX(var(--tidum-pan-x-end, 1.5%)); }
    }
    @keyframes tidum-cinematic-reveal {
      0% { opacity: 0; transform: translateY(var(--tidum-reveal-y, 14px)) scale(var(--tidum-reveal-scale-start, 1.03)); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes tidum-soft-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(calc(var(--tidum-float-y, 8px) * -1)); }
    }
  `;

  // Detect whether any section uses tidum tokens (background matches tidum colors or id/category is tidum)
  const hasTidumSections = sections.some(s =>
    s.background?.color === TIDUM_TOKENS.colorBgMain ||
    s.background?.color === TIDUM_TOKENS.colorPrimary ||
    s.background?.color === TIDUM_TOKENS.colorBgSection ||
    s.id?.startsWith('tidum-tpl-') ||
    s.id?.startsWith('section-') // user-added sections from tidum templates
  );

  const getGalleryAspectRatio = (aspectRatio?: string) => {
    if (aspectRatio === '16:9') return '16 / 9';
    if (aspectRatio === '1:1') return '1 / 1';
    if (aspectRatio === '3:4') return '3 / 4';
    return '4 / 3';
  };

  const getGalleryObjectFit = (imageFit?: string) => {
    return imageFit === 'contain' ? 'contain' : 'cover';
  };

  const getGalleryAnimationAdvanced = (content?: any) => ({
    durationSec: 14,
    delayStepMs: 120,
    easing: 'ease-in-out',
    panScaleStart: 1.02,
    panScaleEnd: 1.12,
    panXStart: -1.5,
    panXEnd: 1.5,
    revealYOffsetPx: 14,
    revealScaleStart: 1.03,
    floatAmplitudePx: 8,
    ...(content?.imageAnimationAdvanced || {}),
  });

  const getGalleryAnimationStyle = (imageAnimation?: string, index = 0, advanced?: any) => {
    const config = {
      durationSec: 14,
      delayStepMs: 120,
      easing: 'ease-in-out',
      ...advanced,
    };

    if (imageAnimation === 'cinematic-pan') {
      return `, animation: 'tidum-cinematic-pan ${config.durationSec}s ${config.easing} ${index * config.delayStepMs}ms infinite alternate'`;
    }
    if (imageAnimation === 'cinematic-reveal') {
      return `, animation: 'tidum-cinematic-reveal ${Math.max(0.2, Number(config.durationSec) || 0.9)}s ${config.easing} ${index * config.delayStepMs}ms both'`;
    }
    if (imageAnimation === 'soft-float') {
      return `, animation: 'tidum-soft-float ${config.durationSec}s ${config.easing} ${index * config.delayStepMs}ms infinite'`;
    }
    return '';
  };

  const getGalleryAnimationVarStyle = (imageAnimation?: string, advanced?: any) => {
    const config = {
      panScaleStart: 1.02,
      panScaleEnd: 1.12,
      panXStart: -1.5,
      panXEnd: 1.5,
      revealYOffsetPx: 14,
      revealScaleStart: 1.03,
      floatAmplitudePx: 8,
      ...advanced,
    };

    if (imageAnimation === 'cinematic-pan') {
      return `, ['--tidum-pan-scale-start' as any]: '${config.panScaleStart}', ['--tidum-pan-scale-end' as any]: '${config.panScaleEnd}', ['--tidum-pan-x-start' as any]: '${config.panXStart}%', ['--tidum-pan-x-end' as any]: '${config.panXEnd}%'`;
    }
    if (imageAnimation === 'cinematic-reveal') {
      return `, ['--tidum-reveal-y' as any]: '${config.revealYOffsetPx}px', ['--tidum-reveal-scale-start' as any]: '${config.revealScaleStart}'`;
    }
    if (imageAnimation === 'soft-float') {
      return `, ['--tidum-float-y' as any]: '${config.floatAmplitudePx}px'`;
    }
    return '';
  };

  const getGalleryAnimationVarStyleHtml = (imageAnimation?: string, advanced?: any) => {
    const config = {
      panScaleStart: 1.02,
      panScaleEnd: 1.12,
      panXStart: -1.5,
      panXEnd: 1.5,
      revealYOffsetPx: 14,
      revealScaleStart: 1.03,
      floatAmplitudePx: 8,
      ...advanced,
    };

    if (imageAnimation === 'cinematic-pan') {
      return `--tidum-pan-scale-start:${config.panScaleStart};--tidum-pan-scale-end:${config.panScaleEnd};--tidum-pan-x-start:${config.panXStart}%;--tidum-pan-x-end:${config.panXEnd}%;`;
    }
    if (imageAnimation === 'cinematic-reveal') {
      return `--tidum-reveal-y:${config.revealYOffsetPx}px;--tidum-reveal-scale-start:${config.revealScaleStart};`;
    }
    if (imageAnimation === 'soft-float') {
      return `--tidum-float-y:${config.floatAmplitudePx}px;`;
    }
    return '';
  };

  const generateReactCode = () => {
    const imports = `import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
${hasTidumSections ? 'import { tidumPageStyles } from "@/lib/tidum-page-styles";\n' : ''}
`;

    const sectionComponents = sections.map((section, idx) => {
      const layoutStyle = section.layout ? {
        display: section.layout.type === 'grid' ? 'grid' : 'flex',
        flexDirection: section.layout.direction || 'row',
        justifyContent: section.layout.justify || 'start',
        alignItems: section.layout.align || 'start',
        gap: `${section.layout.gap}px`,
        ...(section.layout.type === 'grid' && {
          gridTemplateColumns: `repeat(${section.layout.gridCols || 3}, 1fr)`,
        }),
      } : {};

      const sectionContent = section.content?.images && Array.isArray(section.content.images)
        ? `      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(${section.content.cols || 3}, 1fr)' }}>
${section.content.images.map((img: any, i: number) => {
  const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
  const objectFit = getGalleryObjectFit(section.content?.imageFit);
  const animationAdvanced = getGalleryAnimationAdvanced(section.content);
  const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced);
  const animationVarStyle = getGalleryAnimationVarStyle(section.content?.imageAnimation, animationAdvanced);
  const caption = img.caption || img.alt;
  const showCaptions = section.content?.showCaptions !== false;

  return `        <figure key="${i}" className="rounded-xl border overflow-hidden">
          <img
            src={${JSON.stringify(img.src || '')}}
            alt={${JSON.stringify(img.alt || `Galleri-bilde ${i + 1}`)}}
                    style={{ width: '100%', aspectRatio: '${aspectRatio}', objectFit: '${objectFit}'${objectFit === 'contain' ? ", background: '#F8F9F7'" : ''}${animationStyle}${animationVarStyle} }}
          />
${showCaptions && caption ? `          <figcaption className="px-3 py-2 text-xs text-muted-foreground bg-background/80">{${JSON.stringify(caption)}}</figcaption>` : ''}
        </figure>`;
}).join('\n')}
      </div>`
        : `      {/* Add your content here */}`;

      return `function Section${idx}() {
  return (
    <section 
      className="section-${section.type}"
      style={{
        paddingTop: '${section.spacing.paddingTop}px',
        paddingBottom: '${section.spacing.paddingBottom}px',
        paddingLeft: '${section.spacing.paddingX}px',
        paddingRight: '${section.spacing.paddingX}px',
        background: '${section.background.gradient || section.background.color}',
        ${Object.entries(layoutStyle).map(([k, v]) => `${k}: '${v}'`).join(',\n        ')}
      }}
    >
      <Badge>{section.type}</Badge>
      <h2 className="text-3xl font-bold">{section.title}</h2>
${sectionContent}
    </section>
  );
}`;
    }).join('\n\n');

    const mainComponent = `
export function LandingPage() {
  return (
    <${hasTidumSections ? 'main className="tidum-page"' : 'div className="landing-page"'}>
${hasTidumSections ? '      <style>{tidumPageStyles}</style>\n' : ''}${sections.map((_, idx) => `      <Section${idx} />`).join('\n')}
    </${hasTidumSections ? 'main' : 'div'}>
  );
}`;

    return imports + sectionComponents + mainComponent;
  };

  const generateHTMLCode = () => {
    const styles = sections.map((section, idx) => {
      const layoutCSS = section.layout ? `
  .section-${idx} > .content {
    display: ${section.layout.type === 'grid' ? 'grid' : 'flex'};
    flex-direction: ${section.layout.direction || 'row'};
    justify-content: ${section.layout.justify === 'between' ? 'space-between' : section.layout.justify};
    align-items: ${section.layout.align};
    gap: ${section.layout.gap}px;
    ${section.layout.type === 'grid' ? `grid-template-columns: repeat(${section.layout.gridCols || 3}, 1fr);` : ''}
  }` : '';

      const animationCSS = section.animations?.enabled ? `
  .section-${idx} {
    transition: all ${section.animations.duration}ms ease-in-out;
    transition-delay: ${section.animations.delay}ms;
    ${section.animations.type === 'fade' ? 'opacity: 0;' : ''}
    ${section.animations.type === 'slide' ? 'transform: translateY(20px);' : ''}
  }
  .section-${idx}.animated {
    ${section.animations.type === 'fade' ? 'opacity: 1;' : ''}
    ${section.animations.type === 'slide' ? 'transform: translateY(0);' : ''}
  }` : '';

      return `.section-${idx} {
  padding-top: ${section.spacing.paddingTop}px;
  padding-bottom: ${section.spacing.paddingBottom}px;
  padding-left: ${section.spacing.paddingX}px;
  padding-right: ${section.spacing.paddingX}px;
  background: ${section.background.gradient || section.background.color};
}${layoutCSS}${animationCSS}`;
    }).join('\n\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
${hasTidumSections ? `
    /* Tidum Design System */
${tidumPageStyles}
` : ''}    
${galleryAnimationKeyframes}
${styles}
  </style>
</head>
<body>
${sections.map((section, idx) => `  <section class="section-${idx}">
    <span class="badge">${section.type}</span>
    <h2>${section.title}</h2>
    <div class="content">
${section.content?.images && Array.isArray(section.content.images)
  ? `      <div style="display:grid;gap:8px;grid-template-columns:repeat(${section.content.cols || 3},1fr);margin-top:16px;">
${section.content.images.map((img: any, i: number) => {
    const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
    const objectFit = getGalleryObjectFit(section.content?.imageFit);
    const animationAdvanced = getGalleryAnimationAdvanced(section.content);
    const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced).replace(/^,\s*/, '');
    const animationVarStyle = getGalleryAnimationVarStyleHtml(section.content?.imageAnimation, animationAdvanced);
    const caption = img.caption || img.alt;
    const showCaptions = section.content?.showCaptions !== false;

    return `        <figure style="border:1px solid #E1E4E3;border-radius:12px;overflow:hidden;margin:0;">
  <img src="${img.src || ''}" alt="${img.alt || `Galleri-bilde ${i + 1}`}" style="width:100%;aspect-ratio:${aspectRatio};object-fit:${objectFit};${objectFit === 'contain' ? 'background:#F8F9F7;' : ''}${animationStyle}${animationVarStyle}" />
${showCaptions && caption ? `          <figcaption style="padding:8px 12px;font-size:12px;color:#6B7280;background:rgba(255,255,255,0.85);">${caption}</figcaption>` : ''}
        </figure>`;
  }).join('\n')}
      </div>`
  : '      <!-- Add your content here -->'}
    </div>
  </section>`).join('\n\n')}
</body>
</html>`;

    return html;
  };

  const generateTailwindCode = () => {
    const justifyMap: Record<string, string> = {
      'start': 'justify-start',
      'center': 'justify-center',
      'end': 'justify-end',
      'between': 'justify-between',
      'around': 'justify-around',
      'evenly': 'justify-evenly',
    };

    const alignMap: Record<string, string> = {
      'start': 'items-start',
      'center': 'items-center',
      'end': 'items-end',
      'stretch': 'items-stretch',
      'baseline': 'items-baseline',
    };

    const components = sections.map((section, _idx) => {
      const layoutClasses = section.layout ? [
        section.layout.type === 'grid' ? 'grid' : 'flex',
        section.layout.type === 'grid' ? `grid-cols-${section.layout.gridCols || 3}` : '',
        section.layout.direction === 'row' ? 'flex-row' : '',
        section.layout.direction === 'column' ? 'flex-col' : '',
        section.layout.direction === 'row-reverse' ? 'flex-row-reverse' : '',
        section.layout.direction === 'column-reverse' ? 'flex-col-reverse' : '',
        justifyMap[section.layout.justify] || '',
        alignMap[section.layout.align] || '',
        section.layout.wrap ? 'flex-wrap' : '',
        `gap-${Math.round(section.layout.gap / 4)}`,
      ].filter(Boolean).join(' ') : '';

      const spacingClasses = [
        `pt-${Math.round(section.spacing.paddingTop / 4)}`,
        `pb-${Math.round(section.spacing.paddingBottom / 4)}`,
        `px-${Math.round(section.spacing.paddingX / 4)}`,
      ].join(' ');

      const sectionContent = section.content?.images && Array.isArray(section.content.images)
        ? `  <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(${section.content.cols || 3}, 1fr)' }}>
${section.content.images.map((img: any, i: number) => {
  const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
  const objectFit = getGalleryObjectFit(section.content?.imageFit);
  const animationAdvanced = getGalleryAnimationAdvanced(section.content);
  const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced);
  const animationVarStyle = getGalleryAnimationVarStyle(section.content?.imageAnimation, animationAdvanced);
  const caption = img.caption || img.alt;
  const showCaptions = section.content?.showCaptions !== false;

  return `    <figure key="${i}" className="rounded-xl border overflow-hidden">
      <img src={${JSON.stringify(img.src || '')}} alt={${JSON.stringify(img.alt || `Galleri-bilde ${i + 1}`)}} style={{ width: '100%', aspectRatio: '${aspectRatio}', objectFit: '${objectFit}'${objectFit === 'contain' ? ", background: '#F8F9F7'" : ''}${animationStyle}${animationVarStyle} }} />
${showCaptions && caption ? `      <figcaption className="px-3 py-2 text-xs text-muted-foreground bg-white/80">{${JSON.stringify(caption)}}</figcaption>` : ''}
    </figure>`;
}).join('\n')}
  </div>`
        : `  <div className="content">\n    {/* Add your content here */}\n  </div>`;

      return `<section className="${spacingClasses} ${layoutClasses}" style={{ background: '${section.background.gradient || section.background.color}' }}>
  <span className="inline-block px-3 py-1 bg-gray-100 rounded text-sm">${section.type}</span>
  <h2 className="text-3xl font-bold mt-4">${section.title}</h2>
${sectionContent}
</section>`;
    }).join('\n\n');

    return `import React from 'react';

export function LandingPage() {
  return (
    <div className="landing-page">
${components}
    </div>
  );
}`;
  };

  const generateJSONConfig = () => {
    return JSON.stringify({ 
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      designSystem: hasTidumSections ? 'tidum' : 'custom',
      tokens: hasTidumSections ? TIDUM_TOKENS : undefined,
      sections: sections.map(s => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content,
        spacing: s.spacing,
        background: s.background,
        layout: s.layout,
        animations: s.animations,
        order: s.order,
      }))
    }, null, 2);
  };

  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedType(type);
      toast({ 
        title: 'Copied!', 
        description: `${type} code copied to clipboard` 
      });
      setTimeout(() => setCopiedType(null), 2000);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ 
      title: 'Downloaded!', 
      description: `${filename} downloaded successfully` 
    });
  };

  const generateOnServer = async (format: "react" | "html" | "tailwind" | "json") => {
    try {
      setServerLoading((prev) => ({ ...prev, [format]: true }));
      const response = await fetch("/api/cms/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          sections,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code on server");
      }

      const data = await response.json();
      const code = data?.code || "";

      setServerGenerated((prev) => ({ ...prev, [format]: code }));
      toast({
        title: "Generated on server",
        description: `${format.toUpperCase()} code is now using server output`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not generate on server",
        variant: "destructive",
      });
    } finally {
      setServerLoading((prev) => ({ ...prev, [format]: false }));
    }
  };

  const exportOptions = [
    {
      id: 'react',
      name: 'React Component',
      icon: <Braces className="h-5 w-5" />,
      description: 'Clean React JSX with inline styles',
      code: serverGenerated.react ?? generateReactCode(),
      filename: 'LandingPage.tsx',
    },
    {
      id: 'html',
      name: 'HTML/CSS',
      icon: <FileCode className="h-5 w-5" />,
      description: 'Standalone HTML with embedded CSS',
      code: serverGenerated.html ?? generateHTMLCode(),
      filename: 'landing-page.html',
    },
    {
      id: 'tailwind',
      name: 'Tailwind CSS',
      icon: <Palette className="h-5 w-5" />,
      description: 'React with Tailwind utility classes',
      code: serverGenerated.tailwind ?? generateTailwindCode(),
      filename: 'LandingPage.tailwind.tsx',
    },
    {
      id: 'json',
      name: 'JSON Config',
      icon: <FileJson className="h-5 w-5" />,
      description: 'Portable JSON configuration',
      code: serverGenerated.json ?? generateJSONConfig(),
      filename: 'page-config.json',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Code2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Export Code</h3>
        <Badge variant="secondary">{sections.length} sections</Badge>
      </div>

      <Tabs defaultValue="react" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {exportOptions.map((option) => (
            <TabsTrigger key={option.id} value={option.id} className="text-xs">
              {option.icon}
              <span className="ml-1 hidden sm:inline">{option.name.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {exportOptions.map((option) => (
          <TabsContent key={option.id} value={option.id} className="space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {option.icon}
                  {option.name}
                  <Badge variant={serverGenerated[option.id] ? "default" : "secondary"} className="ml-auto">
                    {serverGenerated[option.id] ? "Server-generated" : "Local"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={option.code}
                  readOnly
                  className="font-mono text-xs h-64 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateOnServer(option.id as "react" | "html" | "tailwind" | "json")}
                    disabled={!!serverLoading[option.id]}
                  >
                    {serverLoading[option.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate on Server"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(option.code, option.name)}
                    className="flex-1"
                  >
                    {copiedType === option.name ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(option.code, option.filename)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Export your design as production-ready code. All layouts, animations, and styles are preserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
