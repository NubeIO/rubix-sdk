.PHONY: build clean run build-frontend deploy-frontend dev-frontend

# Go binary build
build:
	@echo "Building PLM plugin..."
	go build -o nube.plm .
	@echo "✓ Build complete: nube.plm"

clean:
	@echo "Cleaning build artifacts..."
	rm -f nube.plm
	@echo "✓ Clean complete"

run: build
	@echo "Running PLM plugin..."
	./nube.plm

# Frontend development targets
build-frontend:
	@echo "Building plugin frontend..."
	cd frontend && pnpm build
	@echo "✓ Frontend build complete"

deploy-frontend: build-frontend
	@echo "Deploying frontend to plugin directory..."
	@rm -rf /home/user/code/go/nube/rubix/bin/dev/orgs/test/plugins/nube.plm/dist-frontend
	@cp -r dist-frontend /home/user/code/go/nube/rubix/bin/dev/orgs/test/plugins/nube.plm/
	@echo "✓ Frontend deployed - just refresh your browser!"

# Quick dev workflow - build + deploy in one step
dev-frontend: deploy-frontend
	@echo ""
	@echo "🎉 Frontend updated! Refresh your browser (Ctrl+Shift+R)"
	@echo ""

# Watch mode - auto rebuild and deploy on changes
watch-frontend:
	@echo "👀 Watching for changes... (Ctrl+C to stop)"
	@echo "Edit files in frontend/src and they'll auto-deploy"
	@echo ""
	@while true; do \
		make -s deploy-frontend; \
		echo "⏳ Waiting for changes..."; \
		inotifywait -r -e modify,create,delete frontend/src 2>/dev/null || \
		(echo "⚠️  inotifywait not installed - using fallback polling" && sleep 3); \
	done
