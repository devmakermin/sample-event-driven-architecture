# Sample Event-Driven Architecture

# Sample Node.js Server

이 저장소는 Node.js 기반 서버 프로젝트 구조와 코딩 스타일을 보여주기 위한 샘플입니다.

실제 인프라(Kafka, Redis, DB 전체 구성)를 모두 포함하기보다는,
실무에서 사용하는 기본 서버 구조와 책임 분리에 초점을 두었습니다.


## Structure

- Route / Service / Repository 계층 분리
- 공통 모듈 기반 인프라 연결 관리
- 환경 설정 분리
- 공통 로깅 구성
- 비동기 처리 및 에러 핸들링 구조


## Purpose

이 프로젝트는 다음을 보여주기 위한 목적입니다:

- 유지보수 가능한 코드 구조
- 명확한 책임 분리 설계
- 일관된 코드 스타일
- 확장 가능한 서버 기본 패턴