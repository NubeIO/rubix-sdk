import { useState } from 'react';
import { MarkdownEditor } from './markdown-editor';
import { Button } from '../../common/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../common/ui/card';

export function MarkdownEditorExample() {
  const [content, setContent] = useState(
    '# Welcome to the Markdown Editor\n\nThis is a **bold** statement with *italic* text.\n\n## Features\n\n- Easy to use\n- Lightweight\n- Customizable\n\n```\ncode block\n```'
  );
  const [readOnly, setReadOnly] = useState(false);

  return (
    <div className="space-y-4 p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Markdown Editor Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={readOnly ? 'outline' : 'default'}
              onClick={() => setReadOnly(false)}
            >
              Edit Mode
            </Button>
            <Button
              variant={readOnly ? 'default' : 'outline'}
              onClick={() => setReadOnly(true)}
            >
              Read-Only Mode
            </Button>
          </div>

          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Start writing your markdown..."
            readOnly={readOnly}
            minHeight="300px"
            maxHeight="600px"
          />

          <div className="text-sm text-muted-foreground">
            Character count: {content.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markdown Output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
            {content}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
