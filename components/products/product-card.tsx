'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { ExternalLink, Store as StoreIcon } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const sortedPrices = [...product.prices].sort(
    (a, b) => Number(a.price) - Number(b.price)
  );
  const lowestPrice = sortedPrices[0];

  return (
    <Card className="hover:shadow-lg transition-all duration-200 animate-in fade-in-50 slide-in-from-right-2">
      <CardHeader className="space-y-2">
        {product.imageUrl && (
          <div className="w-full aspect-square relative bg-muted rounded-md overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-contain w-full h-full p-4"
            />
          </div>
        )}
        <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
        {product.brand && (
          <Badge variant="secondary" className="w-fit">
            {product.brand}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm font-medium">Bester Preis:</span>
            <span className="text-2xl font-bold text-primary">
              €{Number(lowestPrice.price).toFixed(2)}
            </span>
          </div>

          <div className="space-y-2">
            {sortedPrices.slice(0, 3).map((price) => (
              <div
                key={price.id}
                className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StoreIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{price.store.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    €{Number(price.price).toFixed(2)}
                  </span>
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={price.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
