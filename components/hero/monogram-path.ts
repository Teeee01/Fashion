/* Bodoni Moda (upright, display optical size) capital "M", converted to
   outlines from the Google Fonts file: hairline left stem and right
   diagonal, thick left diagonal and right stem, razor-thin serifs.
   MONOGRAM_PATH is the whole letter (used for the ink fill).
   MONOGRAM_STROKES splits the outline into the four strokes in drawing
   order, so the entrance can trace them one after another. */
export const MONOGRAM_VIEWBOX = "0 0 1592 1532";
export const MONOGRAM_ASPECT = 1592 / 1532;

export const MONOGRAM_PATH =
  "M718 1526 162 6H353L813 1248L1254 6H1258L721 1526ZM164 6V1502H319V1506H15V1502H160V10H6V6ZM1586 6V10H1446V1502H1586V1506H1095V1502H1256V6Z";

export const MONOGRAM_STROKES: string[][] = [
  // left stem
  [
    "M164 6L164 1502",
    "M164 1502L319 1502",
    "M319 1502L319 1506",
    "M319 1506L15 1506",
    "M15 1506L15 1502",
    "M15 1502L160 1502",
    "M160 1502L160 10",
    "M160 10L6 10",
    "M6 10L6 6",
    "M6 6L164 6",
  ],
  // left diagonal
  [
    "M162 6L353 6",
    "M718 1526L162 6",
    "M353 6L813 1248",
  ],
  // right diagonal
  [
    "M813 1248L1254 6",
    "M1254 6L1258 6",
    "M1258 6L721 1526",
    "M721 1526L718 1526",
  ],
  // right stem
  [
    "M1586 6L1586 10",
    "M1586 10L1446 10",
    "M1446 10L1446 1502",
    "M1446 1502L1586 1502",
    "M1586 1502L1586 1506",
    "M1586 1506L1095 1506",
    "M1095 1506L1095 1502",
    "M1095 1502L1256 1502",
    "M1256 1502L1256 6",
    "M1256 6L1586 6",
  ],
];
