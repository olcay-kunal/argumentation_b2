# Current Task

## What We're Building
Zihin haritası (Mind Map) PNG indirme işlemi sırasındaki kesilme (clipping) hatasının düzeltilmesi. Kaydırılabilir (scrollable) alandan kaynaklanan bu sorun giderildi.

## Status
Done

## Last Session Summary
2026-05-01 — 
1. `src/components/MindMap.tsx` dosyasında PNG indirme için referans alınan element (`mapRef`), kaydırılabilir alan olan `.mindmap-content` yerine, tüm içeriği barındıran asıl ağaç yapısı `.mm-tree`'ye taşındı.
2. `htmlToImage.toPng` ayarlarında genişlik ve yüksekliğin tam olarak hesaplanıp (padding eklenerek) kapsanması sağlandı. Böylece resmin alt kısımlarının kesilmesi (kırpılması) engellendi.

## Next Steps
- Kullanıcının yeni taleplerini bekliyoruz.

## Blockers
- None
