import { FileHelper, CSSHelper } from "@supernovaio/export-helpers";
import { OutputTextFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters";
import { exportConfiguration } from "..";
import { convertedToken } from "../content/token";

// Define the Typography value structure
interface TokenValue {
  id: string;
  tokenType: TokenType;
  value?: any; // Base value property that will be refined in extended types
}

interface TypographyValue {
  fontFamily: {
    text: string;
  };
  fontSize: {
    measure: number;
  };
  fontWeight: {
    text: string;
  };
  letterSpacing: {
    measure: number;
  };
  lineHeight: {
    measure: number;
  };
}
// Extend the Token type to include typography values
interface TypographyToken extends Token {
  value: TypographyValue;
}

// Type guard to ensure type safety
function isTypographyToken(token: TokenValue): token is TypographyToken {
  return token.tokenType === "Typography" && token.value !== undefined;
}

export function textOutputFile(
  type: TokenType,
  tokens: Array<Token>,
  tokenGroups: Array<TokenGroup>
): OutputTextFile | null {
  // Filter tokens by top level type
  const tokensOfType = tokens.filter((token) => token.tokenType === type);

  // Filter out files where there are no tokens, if enabled
  if (!exportConfiguration.generateEmptyFiles && tokensOfType.length === 0) {
    return null;
  }

  // Convert all tokens to CSS variables
  const mappedTokens = new Map(tokens.map((token) => [token.id, token]));

  const fontFallbacks = {
    pratt: "Georgia, Palatino, Book Antiqua, Times New Roman, serif",
    gmsans: "Helvetica, Arial, Verdana, sans-serif",
    helvetica: "Arial, Verdana, sans-serif"
  };

  const typeStyles = tokensOfType
    .map((token) => {
      const tokenType = token.tokenType || "";

      // Testing the conversion of Typography tokens
      if (isTypographyToken(token)) {
        const fontFamily = token.value.fontFamily.text || "";
        const fontName = fontFamily.replace(" ", "-") || "";
        const fontFamilies = fontFallbacks[fontName.split("-")[0].toLowerCase()] || "";
        const className = `.text-${token.name.toLowerCase()}`;
        const fontWeight = token.value.fontWeight.text || "";
        const fontSize = token.value.fontSize.measure || 0;
        const fontSizeRem = `${token.value.fontSize.measure / 16}rem` || 0;
        const lineHeight = Math.round((token.value.lineHeight.measure / fontSize) * 100) / 100 || 0;
        const letterSpacing = token.value.letterSpacing.measure || 0;

        // Adjust font name based on weight
        token.value.fontFamily.text =
          fontWeight === "700" && !fontName.includes("Helvetica") ? `${fontName}-Bold` : fontName;

        return `${className} {font-family: ${fontFamily}, ${fontFamilies}; font-size: ${fontSizeRem}; font-style: normal; font-weight: normal; line-height: ${lineHeight}; ${
          letterSpacing > 0 ? `letter-spacing: ${letterSpacing}px;` : ""
        }}`;
      }
      return token;
    })
    .join("\n");

  // Create file content
  let content = typeStyles;
  if (exportConfiguration.showGeneratedFileDisclaimer) {
    // Add disclaimer to every file if enabled
    content = `/* ${exportConfiguration.disclaimer} */\n${content}`;
  }

  // Retrieve content as file which content will be directly written to the output
  return FileHelper.createTextFile({
    relativePath: `${exportConfiguration.baseStyleFilePath}`,
    fileName: exportConfiguration.styleFileNames[type],
    content: content
  });
}
